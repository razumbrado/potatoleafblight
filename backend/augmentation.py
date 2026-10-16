"""
Training-time data augmentation (applied to TRAINING images only, never to test images).

These transforms create realistic variations of the real training images (different zoom, angle,
lighting and – for photos with a plain studio background – a natural blurred background), so the
Random Forest learns lesion appearance rather than one particular way of taking the photo:

  * random zoom / crop (close-ups of part of the leaf)
  * 90° rotations and flips
  * brightness, contrast and saturation changes, occasional blur
  * background replacement: the grey background is swapped for a blurred crop of another real
    training leaf, imitating the out-of-focus foliage behind a field photo

Nothing here invents labels or images from scratch – every output is derived from a real,
correctly labelled training photo and keeps that photo's label and leakage group.
"""

from __future__ import annotations

import cv2
import numpy as np


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """Approximate mask of the plain grey/dark studio background (low saturation)."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    mask = ((hsv[..., 1] < 45) | (hsv[..., 2] < 35)).astype(np.uint8)
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    # Keep only background regions touching the image border, so grey lesions inside the leaf stay.
    count, labels = cv2.connectedComponents(mask)
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    keep = np.isin(labels, list(border)) if border else np.zeros_like(mask, dtype=bool)
    return cv2.GaussianBlur(keep.astype(np.float32), (7, 7), 0)


def replace_background(rgb: np.ndarray, donor: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    alpha = background_mask(rgb)[..., None]
    if alpha.mean() < 0.05:
        return rgb
    h, w = rgb.shape[:2]
    # Zoom into the donor leaf so mostly green tissue fills the frame, then blur it like a shallow depth of field.
    dh, dw = donor.shape[:2]
    size = int(min(dh, dw) * rng.uniform(0.35, 0.6))
    y = rng.integers(int(dh * 0.2), max(int(dh * 0.2) + 1, dh - size - int(dh * 0.1)))
    x = rng.integers(int(dw * 0.2), max(int(dw * 0.2) + 1, dw - size - int(dw * 0.1)))
    patch = cv2.resize(donor[y : y + size, x : x + size], (w, h), interpolation=cv2.INTER_LINEAR)
    k = int(rng.choice([15, 21, 31])) | 1
    patch = cv2.GaussianBlur(patch, (k, k), 0)
    patch = np.clip(patch.astype(np.float32) * rng.uniform(0.5, 1.0), 0, 255)
    out = rgb.astype(np.float32) * (1 - alpha) + patch * alpha
    return out.astype(np.uint8)


def random_crop(rgb: np.ndarray, rng: np.random.Generator, min_area: float = 0.2) -> np.ndarray:
    h, w = rgb.shape[:2]
    area = rng.uniform(min_area, 1.0)
    aspect = np.exp(rng.uniform(np.log(0.75), np.log(1.33)))
    ch = int(min(h, round(np.sqrt(area * h * w / aspect))))
    cw = int(min(w, round(np.sqrt(area * h * w * aspect))))
    # Bias the crop toward the centre, where the leaf is.
    y = int(np.clip(rng.normal((h - ch) / 2, (h - ch) / 4 + 1), 0, h - ch))
    x = int(np.clip(rng.normal((w - cw) / 2, (w - cw) / 4 + 1), 0, w - cw))
    return rgb[y : y + ch, x : x + cw]


def photometric(rgb: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    img = rgb.astype(np.float32)
    img = img * rng.uniform(0.75, 1.25)  # brightness
    mean = img.mean()
    img = (img - mean) * rng.uniform(0.75, 1.3) + mean  # contrast
    img = np.clip(img, 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * rng.uniform(0.8, 1.25), 0, 255)
    img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    if rng.random() < 0.25:
        img = cv2.GaussianBlur(img, (3, 3), 0)
    return img


def augment(rgb: np.ndarray, donor: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    img = rgb
    if rng.random() < 0.6:
        img = replace_background(img, donor, rng)
    img = np.rot90(img, int(rng.integers(4)))
    if rng.random() < 0.5:
        img = np.fliplr(img)
    if rng.random() < 0.8:
        img = random_crop(np.ascontiguousarray(img), rng)
    return photometric(np.ascontiguousarray(img), rng)
