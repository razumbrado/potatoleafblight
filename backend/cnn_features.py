"""
Deep features from a pretrained CNN, used as numerical input for the Random Forest.

The CNN is ONLY a feature extractor: its ImageNet classification head is removed and its weights are
never trained here. Each image becomes a fixed-length vector (1,280 numbers for EfficientNet-B0)
describing colours, textures and shapes; the Random Forest does all of the classification.

Two interchangeable runtimes compute the same network:
  * ONNX Runtime (preferred) – uses models/cnn/efficientnet_b0.onnx; small and light enough for free
    hosting (no PyTorch needed at prediction time).
  * PyTorch / torchvision – used to export the ONNX file, and as a fallback when it is missing.

Image preprocessing (resize + ImageNet normalisation) is done with Pillow and NumPy only, so it is
identical in training and in deployment whichever runtime runs the network.
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any, Sequence

import numpy as np
from PIL import Image

MODELS_DIR = Path(__file__).resolve().parent / "models"
ONNX_DIR = MODELS_DIR / "cnn"
TORCH_HOME = MODELS_DIR / "torch"

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 3, 1, 1)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 3, 1, 1)

BACKBONES: dict[str, dict[str, Any]] = {
    "efficientnet_b0": {"dim": 1280, "label": "EfficientNet-B0 (ImageNet-pretrained, frozen)"},
}

_lock = threading.Lock()
_sessions: dict[str, Any] = {}
_torch_models: dict[str, Any] = {}


def onnx_path(backbone: str) -> Path:
    return ONNX_DIR / f"{backbone}.onnx"


def preprocess(images: Sequence[np.ndarray], size: int) -> np.ndarray:
    """RGB uint8 images of any size -> normalised float32 NCHW batch."""
    batch = np.stack(
        [np.asarray(Image.fromarray(np.ascontiguousarray(img, dtype=np.uint8)).resize((size, size), Image.Resampling.BILINEAR)) for img in images]
    )
    x = batch.astype(np.float32).transpose(0, 3, 1, 2) / 255.0
    return ((x - IMAGENET_MEAN) / IMAGENET_STD).astype(np.float32)


def _torch_model(backbone: str):
    os.environ.setdefault("TORCH_HOME", str(TORCH_HOME))
    import torch
    import torchvision

    if backbone not in _torch_models:
        if backbone != "efficientnet_b0":
            raise ValueError(f"Unknown CNN backbone '{backbone}'.")
        model = torchvision.models.efficientnet_b0(weights=torchvision.models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        model.classifier = torch.nn.Identity()  # drop the ImageNet head -> pooled feature vector
        _torch_models[backbone] = model.eval()
    return _torch_models[backbone]


def export_onnx(backbone: str = "efficientnet_b0") -> Path:
    """Exports the frozen feature extractor to ONNX (needs PyTorch; run once, e.g. by train_model.py)."""
    import torch

    path = onnx_path(backbone)
    path.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        model = _torch_model(backbone)
    torch.onnx.export(
        model,
        torch.zeros(1, 3, 224, 224),
        str(path),
        input_names=["input"],
        output_names=["features"],
        dynamic_axes={"input": {0: "batch"}, "features": {0: "batch"}},
        opset_version=17,
    )
    _sessions.pop(backbone, None)
    return path


def _onnx_session(backbone: str):
    if backbone in _sessions:
        return _sessions[backbone]
    path = onnx_path(backbone)
    if not path.exists() or os.getenv("BLIGHTVISION_CNN_RUNTIME") == "torch":
        return None
    try:
        import onnxruntime as ort
    except ImportError:
        return None
    options = ort.SessionOptions()
    options.log_severity_level = 3
    _sessions[backbone] = ort.InferenceSession(str(path), sess_options=options, providers=["CPUExecutionProvider"])
    return _sessions[backbone]


def runtime_name(config: dict[str, Any]) -> str:
    return "onnxruntime" if _onnx_session(config["backbone"]) is not None else "pytorch"


def embed(images: Sequence[np.ndarray], config: dict[str, Any], batch_size: int = 32) -> np.ndarray:
    """Returns an (n, dim) float32 array of CNN features for RGB uint8 images of any size."""
    backbone, size = config["backbone"], int(config["input_size"])
    if backbone not in BACKBONES:
        raise ValueError(f"Unknown CNN backbone '{backbone}'.")
    with _lock:
        session = _onnx_session(backbone)
        torch_model = None if session is not None else _torch_model(backbone)
    out = []
    for start in range(0, len(images), batch_size):
        x = preprocess(images[start : start + batch_size], size)
        if session is not None:
            features = session.run(None, {"input": x})[0]
        else:
            import torch

            with torch.inference_mode():
                features = torch_model(torch.from_numpy(x)).flatten(1).numpy()
        out.append(features.astype(np.float32))
    return np.vstack(out) if out else np.zeros((0, BACKBONES[backbone]["dim"]), dtype=np.float32)
