"""
Loads the saved Random Forest once and runs real-time predictions with it.

The model is never retrained here. If train_model.py writes a new model while the API is running,
the file's modification time changes and the new model is picked up on the next request.
"""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from feature_extraction import extract_features, load_rgb_from_bytes

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "random_forest.joblib"
EVALUATION_PATH = MODELS_DIR / "evaluation.json"
INFO_PATH = MODELS_DIR / "model_info.json"

EXPECTED_CLASSES = ["Early Blight", "Late Blight"]


class ModelNotAvailableError(RuntimeError):
    """Raised when no trained model exists yet (train_model.py has not been run)."""


class Predictor:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self.model_path = model_path
        self._lock = threading.Lock()
        self._bundle: dict[str, Any] | None = None
        self._mtime: float | None = None
        self.load_error: str | None = None

    def _load(self) -> dict[str, Any]:
        if not self.model_path.exists():
            self._bundle, self._mtime = None, None
            raise ModelNotAvailableError(
                "No trained model found. Run `python train_model.py` in the backend folder to train it."
            )
        mtime = self.model_path.stat().st_mtime
        if self._bundle is not None and self._mtime == mtime:
            return self._bundle
        with self._lock:
            if self._bundle is not None and self._mtime == mtime:
                return self._bundle
            try:
                bundle = joblib.load(self.model_path)
                classes = [str(label) for label in bundle["model"].classes_]
                if sorted(classes) != sorted(EXPECTED_CLASSES):
                    raise ValueError(f"model classes {classes} do not match {EXPECTED_CLASSES}")
                # Warm up (and validate) the feature pipeline, e.g. load the CNN weights, so the first
                # real prediction is fast and an incompatible model is reported at load time.
                extract_features(np.zeros((64, 64, 3), dtype=np.uint8), bundle["feature_config"])
            except Exception as exc:
                self.load_error = f"The trained model file could not be loaded: {exc}"
                raise ModelNotAvailableError(self.load_error) from exc
            self._bundle, self._mtime, self.load_error = bundle, mtime, None
            return bundle

    def is_available(self) -> bool:
        try:
            self._load()
            return True
        except ModelNotAvailableError:
            return False

    @property
    def model_version(self) -> str | None:
        try:
            return str(self._load()["model_version"])
        except ModelNotAvailableError:
            return None

    def predict(self, image_bytes: bytes) -> dict[str, Any]:
        bundle = self._load()
        started = time.perf_counter()
        rgb = load_rgb_from_bytes(image_bytes)
        features = extract_features(rgb, bundle["feature_config"]).reshape(1, -1)
        model = bundle["model"]
        probabilities = model.predict_proba(features)[0]
        by_class = {str(label): float(prob) for label, prob in zip(model.classes_, probabilities)}
        if not all(np.isfinite(value) for value in by_class.values()):
            raise RuntimeError("The model returned an invalid probability.")
        predicted = str(model.classes_[int(np.argmax(probabilities))])
        return {
            "predicted_class": predicted,
            "confidence": by_class[predicted],
            "probabilities": {label: by_class[label] for label in EXPECTED_CLASSES},
            "model": "Random Forest",
            "model_version": bundle["model_version"],
            "inference_ms": round((time.perf_counter() - started) * 1000, 1),
        }


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ModelNotAvailableError(
            f"{path.name} was not found. Run `python train_model.py` in the backend folder to train and evaluate the model."
        )
    return json.loads(path.read_text(encoding="utf-8"))
