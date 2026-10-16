"""
Image preprocessing and numerical feature extraction for the BlightVision Random Forest.

A Random Forest cannot read pixels directly, so every image is turned into one fixed-length
numerical vector:

  0. CNN features       – the pooled output of a frozen, ImageNet-pretrained EfficientNet-B0
                          (cnn_features.py). The CNN only describes the image; it does not classify.

  1. Colour histograms  – HSV and CIELAB per-channel histograms (normalised).
  2. Colour moments     – mean, standard deviation and skewness of every HSV / LAB channel.
  3. HOG                – Histogram of Oriented Gradients on the grayscale image (shape / edges).
  4. LBP                – uniform Local Binary Pattern histograms at two radii (fine texture).
  5. GLCM               – Haralick-style grey-level co-occurrence statistics (coarse texture).
  6. Lesion features    – colour, count, size distribution and shape of the diseased spots only,
                          which keeps working when the background or zoom level changes.

The exact same code path is used for training, testing and real-time prediction. The settings
are stored in FEATURE_CONFIG and saved next to the trained model, so a prediction is always
made with the configuration the model was trained on.
"""

from __future__ import annotations

import io
from typing import Any, Sequence

import cv2
import numpy as np
from PIL import Image, ImageOps
from skimage.feature import graycomatrix, graycoprops, hog, local_binary_pattern

# Bump FEATURE_VERSION whenever the feature layout changes: a model trained with a different
# version is refused at prediction time instead of silently producing meaningless output.
FEATURE_VERSION = 4  # 4: Pillow-based CNN preprocessing shared by PyTorch and ONNX Runtime

FEATURE_CONFIG: dict[str, Any] = {
    "version": FEATURE_VERSION,
    # Frozen ImageNet-pretrained CNN used only to turn the image into numbers (see cnn_features.py).
    "cnn": {"backbone": "efficientnet_b0", "input_size": 224, "dim": 1280},
    "handcrafted": True,
    "max_side": 384,
    "image_size": 128,
    "color_hist_bins": 32,
    # Coarse HOG cells: enough to describe lesion shape without drowning out the colour/lesion features.
    "hog": {"orientations": 9, "pixels_per_cell": [32, 32], "cells_per_block": [2, 2], "block_norm": "L2-Hys"},
    "lbp": [{"points": 8, "radius": 1}, {"points": 16, "radius": 2}],
    "glcm": {"distances": [1, 3], "angles_deg": [0, 45, 90, 135], "levels": 64},
    "lesion_features": True,
}

FEATURE_METHODS = [
    "Deep features from a frozen, ImageNet-pretrained EfficientNet-B0 CNN (1,280 values; classification head removed)",
    "Colour histograms (HSV + CIELAB, 32 bins per channel)",
    "Colour moments (mean, standard deviation, skewness per HSV / CIELAB channel)",
    "Histogram of Oriented Gradients (HOG)",
    "Local Binary Patterns (uniform, two radii)",
    "Grey-Level Co-occurrence Matrix (GLCM) texture statistics",
    "Lesion features (colour of diseased tissue, lesion count, size distribution, circularity, solidity)",
]

GLCM_PROPS = ("contrast", "dissimilarity", "homogeneity", "energy", "correlation", "ASM")


def load_rgb_from_bytes(data: bytes) -> np.ndarray:
    """Decodes image bytes into an RGB uint8 array. Raises ValueError for unreadable data."""
    try:
        with Image.open(io.BytesIO(data)) as img:
            img = ImageOps.exif_transpose(img)  # respect phone camera orientation
            return np.asarray(img.convert("RGB"), dtype=np.uint8)
    except Exception as exc:  # Pillow raises many different exception types
        raise ValueError("The file could not be decoded as an image.") from exc


def load_rgb_from_path(path: str) -> np.ndarray:
    with open(path, "rb") as handle:
        return load_rgb_from_bytes(handle.read())


def limit_size(rgb: np.ndarray, config: dict[str, Any] = FEATURE_CONFIG) -> np.ndarray:
    """Shrinks large photos (keeping aspect ratio) so every image enters the pipeline at a similar
    resolution, whether it is a 256 px dataset image or a 12 MP phone photo."""
    max_side = int(config.get("max_side", 0))
    h, w = rgb.shape[:2]
    if max_side and max(h, w) > max_side:
        scale = max_side / max(h, w)
        rgb = cv2.resize(rgb, (max(1, round(w * scale)), max(1, round(h * scale))), interpolation=cv2.INTER_AREA)
    return rgb


def preprocess(rgb: np.ndarray, config: dict[str, Any] = FEATURE_CONFIG) -> np.ndarray:
    """Resizes an RGB image to the square size used by the model."""
    size = int(config["image_size"])
    return cv2.resize(rgb, (size, size), interpolation=cv2.INTER_AREA)


def _channel_histograms(image: np.ndarray, ranges: list[tuple[int, int]], bins: int) -> np.ndarray:
    parts = []
    for channel, (low, high) in enumerate(ranges):
        hist = cv2.calcHist([image], [channel], None, [bins], [low, high]).ravel()
        parts.append(hist / max(hist.sum(), 1.0))
    return np.concatenate(parts)


def _color_moments(image: np.ndarray) -> np.ndarray:
    pixels = image.reshape(-1, image.shape[-1]).astype(np.float64)
    mean = pixels.mean(axis=0)
    std = pixels.std(axis=0)
    centred = pixels - mean
    skew = np.cbrt((centred**3).mean(axis=0))
    return np.concatenate([mean, std, skew])


def _lbp_histograms(gray: np.ndarray, settings: list[dict[str, int]]) -> np.ndarray:
    parts = []
    for item in settings:
        points, radius = int(item["points"]), int(item["radius"])
        lbp = local_binary_pattern(gray, points, radius, method="uniform")
        bins = points + 2  # uniform patterns + one "non-uniform" bin
        hist, _ = np.histogram(lbp.ravel(), bins=bins, range=(0, bins))
        parts.append(hist.astype(np.float64) / max(hist.sum(), 1))
    return np.concatenate(parts)


def _glcm_features(gray: np.ndarray, settings: dict[str, Any]) -> np.ndarray:
    levels = int(settings["levels"])
    quantised = (gray.astype(np.uint16) * levels // 256).astype(np.uint8)
    angles = [np.deg2rad(angle) for angle in settings["angles_deg"]]
    glcm = graycomatrix(quantised, distances=settings["distances"], angles=angles, levels=levels, symmetric=True, normed=True)
    # Average over angles -> rotation-tolerant value per (property, distance).
    return np.concatenate([graycoprops(glcm, prop).mean(axis=1) for prop in GLCM_PROPS])


def lesion_mask(hsv: np.ndarray) -> np.ndarray:
    """Diseased (necrotic / chlorotic) tissue: brown, tan, yellow or dark-brown pixels that are not
    healthy green and not the low-saturation studio background."""
    h, s, v = hsv[..., 0].astype(np.int16), hsv[..., 1].astype(np.int16), hsv[..., 2].astype(np.int16)
    brown_yellow = (h <= 30) & (s >= 50) & (v >= 40)
    dark_necrotic = (v < 80) & (s >= 40) & ((h <= 35) | (h >= 160))
    mask = (brown_yellow | dark_necrotic).astype(np.uint8)
    return cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))


def _lesion_features(image: np.ndarray, hsv: np.ndarray, lab: np.ndarray, bins: int) -> np.ndarray:
    """Colour and shape of the lesions only, so the background and zoom level matter less.

    Early Blight tends to form many small, round, brown spots with concentric rings; Late Blight forms
    larger, irregular, darker patches. These descriptors are scale-tolerant (shares and ratios, not pixel counts).
    """
    mask = lesion_mask(hsv)
    plant = (hsv[..., 1] >= 45).astype(np.uint8)  # coloured tissue (leaf + lesions), excludes grey background
    plant_px = max(int(plant.sum()), 1)
    lesion_px = int(mask.sum())

    color_parts = []
    for img, ranges in ((hsv, [(0, 180), (0, 256), (0, 256)]), (lab, [(0, 256), (0, 256), (0, 256)])):
        for channel, (low, high) in enumerate(ranges):
            hist = cv2.calcHist([img], [channel], mask if lesion_px else None, [bins // 2], [low, high]).ravel()
            color_parts.append(hist / max(hist.sum(), 1.0) if lesion_px else np.zeros(bins // 2))

    if lesion_px:
        pixels = lab[mask.astype(bool)].astype(np.float64)
        lab_stats = np.concatenate([pixels.mean(axis=0), pixels.std(axis=0)])
        hsv_pixels = hsv[mask.astype(bool)].astype(np.float64)
        dark_share = float((hsv_pixels[:, 2] < 80).mean())
    else:
        lab_stats, dark_share = np.zeros(6), 0.0

    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    areas = stats[1:, cv2.CC_STAT_AREA].astype(np.float64)
    keep = areas >= 6
    circularities, solidities, fills = [], [], []
    for index in np.flatnonzero(keep) + 1:
        component = (labels == index).astype(np.uint8)
        contours, _ = cv2.findContours(component, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        hull = cv2.contourArea(cv2.convexHull(contour))
        if perimeter > 0:
            circularities.append(4 * np.pi * area / perimeter**2)
        if hull > 0:
            solidities.append(area / hull)
        x, y, w, h = cv2.boundingRect(contour)
        fills.append(area / max(w * h, 1))
    areas = areas[keep]
    total = max(areas.sum(), 1.0)

    def stats_of(values: list[float] | np.ndarray) -> list[float]:
        values = np.asarray(values, dtype=np.float64)
        return [values.mean(), np.median(values), values.std()] if values.size else [0.0, 0.0, 0.0]

    shape = [
        lesion_px / plant_px,  # how much of the visible plant tissue is diseased
        np.log1p(areas.size),  # number of lesions (log)
        (areas.max() / total) if areas.size else 0.0,  # one dominant patch vs many spots
        (np.sort(areas)[-3:].sum() / total) if areas.size else 0.0,
        float((areas / total < 0.05).mean()) if areas.size else 0.0,  # share of small spots
        dark_share,
        *stats_of(circularities),
        *stats_of(solidities),
        *stats_of(fills),
    ]
    return np.concatenate([*color_parts, lab_stats, np.asarray(shape, dtype=np.float64)])


def _check_version(config: dict[str, Any]) -> None:
    if int(config.get("version", -1)) != FEATURE_VERSION:
        raise ValueError(
            f"Feature configuration version {config.get('version')} does not match this code ({FEATURE_VERSION}). Retrain the model."
        )


def extract_feature_matrix(images: Sequence[np.ndarray], config: dict[str, Any] = FEATURE_CONFIG, n_jobs: int = 1) -> np.ndarray:
    """Feature matrix (one row per RGB image): pretrained-CNN features followed by hand-crafted features.
    Used identically for training, testing and live prediction."""
    _check_version(config)
    images = [limit_size(img, config) for img in images]
    parts = []
    if config.get("cnn"):
        from cnn_features import embed  # imported lazily: PyTorch is only needed when the model uses it

        parts.append(embed(images, config["cnn"]))
    if config.get("handcrafted", True):
        if n_jobs == 1:
            rows = [handcrafted_features(img, config) for img in images]
        else:
            from joblib import Parallel, delayed

            rows = Parallel(n_jobs=n_jobs)(delayed(handcrafted_features)(img, config) for img in images)
        parts.append(np.vstack(rows))
    return np.hstack(parts).astype(np.float32)


def extract_features(rgb: np.ndarray, config: dict[str, Any] = FEATURE_CONFIG) -> np.ndarray:
    """Returns the 1-D float32 feature vector for one RGB image."""
    return extract_feature_matrix([rgb], config)[0]


def handcrafted_features(rgb: np.ndarray, config: dict[str, Any] = FEATURE_CONFIG) -> np.ndarray:
    """Colour, HOG, LBP, GLCM and lesion features for one RGB image."""
    image = preprocess(rgb, config)
    bins = int(config["color_hist_bins"])

    hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)  # OpenCV 8-bit hue range is 0–179
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    hog_cfg = config["hog"]
    hog_features = hog(
        gray,
        orientations=int(hog_cfg["orientations"]),
        pixels_per_cell=tuple(hog_cfg["pixels_per_cell"]),
        cells_per_block=tuple(hog_cfg["cells_per_block"]),
        block_norm=hog_cfg["block_norm"],
        feature_vector=True,
    )

    vector = np.concatenate(
        [
            _channel_histograms(hsv, [(0, 180), (0, 256), (0, 256)], bins),
            _channel_histograms(lab, [(0, 256), (0, 256), (0, 256)], bins),
            _color_moments(hsv),
            _color_moments(lab),
            hog_features,
            _lbp_histograms(gray, config["lbp"]),
            _glcm_features(gray, config["glcm"]),
            *([_lesion_features(image, hsv, lab, bins)] if config.get("lesion_features") else []),
        ]
    )
    return vector.astype(np.float32)


def feature_layout(config: dict[str, Any] = FEATURE_CONFIG) -> dict[str, int]:
    """Number of features contributed by each extraction method (for documentation / the API)."""
    size = int(config["image_size"])
    hog_cfg = config["hog"]
    cells = size // hog_cfg["pixels_per_cell"][0]
    blocks = cells - hog_cfg["cells_per_block"][0] + 1
    hog_len = blocks * blocks * hog_cfg["cells_per_block"][0] * hog_cfg["cells_per_block"][1] * hog_cfg["orientations"]
    cnn = config.get("cnn")
    cnn_part = {"cnn_" + cnn["backbone"]: int(cnn["dim"])} if cnn else {}
    if not config.get("handcrafted", True):
        return cnn_part
    return {
        **cnn_part,
        "color_histograms": 6 * int(config["color_hist_bins"]),
        "color_moments": 18,
        "hog": hog_len,
        "lbp": sum(int(item["points"]) + 2 for item in config["lbp"]),
        "glcm": len(GLCM_PROPS) * len(config["glcm"]["distances"]),
        **({"lesion": 6 * (int(config["color_hist_bins"]) // 2) + 6 + 15} if config.get("lesion_features") else {}),
    }
