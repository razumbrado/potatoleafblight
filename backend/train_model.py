"""
Trains the BlightVision Random Forest classifier on the images in backend/dataset/.

    python train_model.py                 # train with hyperparameter search (recommended)
    python train_model.py --no-tune       # train once with the default hyperparameters
    python train_model.py --dataset PATH  # use a different dataset folder

Expected dataset layout (folder names are matched case-insensitively):

    dataset/
      Early_Blight/   *.jpg | *.jpeg | *.png | *.webp | *.bmp   (sub-folders allowed)
      Late_Blight/    ...

Images directly inside a class folder count as source "main_dataset"; images in a sub-folder use the
sub-folder name as their source (e.g. Early_Blight/field_tanzania/). Test metrics are reported overall
and per source, so performance on field photos is visible separately.

Outputs (in backend/models/):
    random_forest.joblib   trained model + feature configuration + metadata
    evaluation.json        metrics computed on the untouched test split
    model_info.json        algorithm, hyperparameters, dataset and split description

Leakage protection
------------------
Augmented copies (flips / 90° rotations) and near-identical photos of the same leaf are detected
with a rotation/flip-invariant perceptual hash and placed in the same group. The train/test split
and every cross-validation fold are group-aware, so related images never end up on both sides.
Training-time augmentation is applied to the training split only. Hyperparameter tuning only ever
sees the training split; the test split is used exactly once, for the final evaluation.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from joblib import Parallel, delayed
from PIL import Image
from sklearn.base import clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedGroupKFold

from augmentation import augment
from feature_extraction import (
    FEATURE_CONFIG,
    FEATURE_METHODS,
    extract_feature_matrix,
    feature_layout,
    limit_size,
    load_rgb_from_path,
)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = BASE_DIR / "dataset"
DEFAULT_OUTPUT = BASE_DIR / "models"

CLASSES = ["Early Blight", "Late Blight"]
# Late Blight is the positive class for the binary precision / recall / F1 figures because it is
# the faster-spreading, more destructive disease – missing it is the costlier error.
POSITIVE_CLASS = "Late Blight"
FOLDER_ALIASES = {"earlyblight": "Early Blight", "lateblight": "Late Blight"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ROOT_SOURCE = "main_dataset"

RANDOM_STATE = 42
TEST_FOLDS = 5  # one of five stratified group folds -> 20 % test
MODEL_FILE = "random_forest.joblib"
AUGMENT_COPIES = 2  # augmented versions of each TRAINING image (see augmentation.py)
AUGMENT_SEED = 1_000_000
STRESS_COPIES = 2  # field-style versions of each TEST image for the robustness check
STRESS_SEED = 9_000_000
BATCH = 256  # images per feature-extraction batch (keeps memory low)

# Defaults used with --no-tune; also the centre of the search space below.
DEFAULT_PARAMS = {
    "n_estimators": 400,
    "max_depth": 30,
    "min_samples_split": 4,
    "min_samples_leaf": 1,
    "max_features": "sqrt",
}

# Complexity is deliberately bounded (finite depth, leaf/split minimums) to limit overfitting.
SEARCH_SPACE = {
    "n_estimators": [200, 300, 400, 500],
    "max_depth": [12, 20, 30, 40],
    "min_samples_split": [2, 4, 8],
    "min_samples_leaf": [1, 2, 4],
    "max_features": ["sqrt", "log2", 0.05],
}


def log(message: str) -> None:
    print(message, flush=True)


# --------------------------------------------------------------------------- dataset loading
def find_class_folders(dataset: Path) -> dict[str, Path]:
    if not dataset.is_dir():
        raise SystemExit(
            f"\nDataset folder not found: {dataset}\n"
            "Create it with one sub-folder per class and add your images:\n"
            "    backend/dataset/Early_Blight/\n"
            "    backend/dataset/Late_Blight/\n"
        )
    found: dict[str, Path] = {}
    for child in sorted(dataset.iterdir()):
        if not child.is_dir():
            continue
        key = "".join(ch for ch in child.name.lower() if ch.isalnum())
        label = FOLDER_ALIASES.get(key)
        if label is None:
            log(f"  ! Ignoring folder '{child.name}' (not an Early Blight / Late Blight class folder)")
            continue
        if label in found:
            raise SystemExit(f"Two folders map to '{label}': {found[label].name} and {child.name}. Keep only one.")
        found[label] = child
    missing = [label for label in CLASSES if label not in found]
    if missing:
        raise SystemExit(
            f"\nMissing class folder(s) for: {', '.join(missing)} in {dataset}\n"
            "Expected sub-folders named Early_Blight and Late_Blight."
        )
    return found


def validate_image(path: Path) -> str | None:
    """Returns an error description, or None if the file is a readable image."""
    try:
        with Image.open(path) as img:
            img.verify()
        with Image.open(path) as img:
            img.load()
            if min(img.size) < 32:
                return f"too small ({img.size[0]}x{img.size[1]})"
    except Exception as exc:
        return f"unreadable ({exc.__class__.__name__})"
    return None


def load_dataset(dataset: Path) -> tuple[pd.DataFrame, list[dict[str, str]]]:
    folders = find_class_folders(dataset)
    candidates = []
    rejected = []
    for label in CLASSES:
        for path in sorted(folders[label].rglob("*")):
            if not path.is_file() or path.name.lower() == "readme.md":
                continue
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                rejected.append({"file": str(path.relative_to(dataset)), "reason": "not an image extension"})
                continue
            relative = path.relative_to(folders[label])
            source = relative.parts[0] if len(relative.parts) > 1 else ROOT_SOURCE
            candidates.append((path, label, source))
    problems = Parallel(n_jobs=-1, prefer="threads")(delayed(validate_image)(path) for path, _, _ in candidates)
    rows = []
    for (path, label, source), problem in zip(candidates, problems):
        if problem:
            rejected.append({"file": str(path.relative_to(dataset)), "reason": problem})
        else:
            rows.append({"path": str(path), "label": label, "source": source})
    frame = pd.DataFrame(rows)
    if frame.empty:
        raise SystemExit("\nNo valid images were found. Place potato leaf images in the class folders and retry.")
    counts = frame["label"].value_counts()
    too_few = [label for label in CLASSES if counts.get(label, 0) < TEST_FOLDS * 2]
    if too_few:
        raise SystemExit(f"\nNot enough images for: {', '.join(too_few)}. Each class needs at least {TEST_FOLDS * 2} images.")
    return frame, rejected


# --------------------------------------------------------------------------- duplicate grouping
def _dhash_bits(gray: np.ndarray) -> int:
    small = np.asarray(Image.fromarray(gray).resize((9, 8), Image.Resampling.LANCZOS), dtype=np.int16)
    diff = (small[:, 1:] > small[:, :-1]).ravel()
    return int("".join("1" if bit else "0" for bit in diff), 2)


def invariant_hash(path: str) -> int:
    """Perceptual hash that is identical for an image and its flips / 90° rotations."""
    with Image.open(path) as img:
        gray = np.asarray(img.convert("L").resize((64, 64), Image.Resampling.LANCZOS))
    variants = []
    for k in range(4):
        rotated = np.rot90(gray, k)
        variants.append(_dhash_bits(np.ascontiguousarray(rotated)))
        variants.append(_dhash_bits(np.ascontiguousarray(np.fliplr(rotated))))
    return min(variants)


_POPCOUNT = np.array([bin(i).count("1") for i in range(256)], dtype=np.uint8)


def group_near_duplicates(hashes: list[int], max_distance: int = 4) -> np.ndarray:
    """Union-find over images whose hashes differ in at most `max_distance` bits."""
    values = np.array(hashes, dtype=np.uint64)
    parent = list(range(len(values)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(values) - 1):
        xor = (values[i + 1 :] ^ values[i]).view(np.uint8).reshape(-1, 8)
        distance = _POPCOUNT[xor].sum(axis=1)
        for j in np.flatnonzero(distance <= max_distance) + i + 1:
            parent[find(i)] = find(int(j))
    roots = [find(i) for i in range(len(values))]
    remap = {root: index for index, root in enumerate(dict.fromkeys(roots))}
    return np.array([remap[root] for root in roots])


# --------------------------------------------------------------------------- features
def load_limited(path: str) -> np.ndarray:
    return limit_size(load_rgb_from_path(path), FEATURE_CONFIG)


def features_for_images(images: list[np.ndarray], n_jobs: int) -> np.ndarray:
    return np.vstack([extract_feature_matrix(images[s : s + BATCH], FEATURE_CONFIG, n_jobs=n_jobs) for s in range(0, len(images), BATCH)])


def augmented_feature_matrix(images: list[np.ndarray], jobs: list[tuple[int, int, int]], n_jobs: int) -> np.ndarray:
    """jobs = (image index, donor index, seed). Images are augmented in batches, then featurised."""
    parts = []
    for s in range(0, len(jobs), BATCH):
        batch = Parallel(n_jobs=n_jobs, prefer="threads")(
            delayed(augment)(images[i], images[d], np.random.default_rng(seed)) for i, d, seed in jobs[s : s + BATCH]
        )
        parts.append(extract_feature_matrix(batch, FEATURE_CONFIG, n_jobs=n_jobs))
        log(f"    {min(s + BATCH, len(jobs))}/{len(jobs)}")
    return np.vstack(parts)


# --------------------------------------------------------------------------- metrics
def confidence_bins(confidence: np.ndarray, correct: np.ndarray) -> list[dict]:
    """How often test predictions in each confidence band were actually correct."""
    bins = []
    for low, high in [(0.5, 0.6), (0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.0001)]:
        mask = (confidence >= low) & (confidence < high)
        bins.append(
            {
                "range": [low, min(high, 1.0)],
                "images": int(mask.sum()),
                "accuracy": float(correct[mask].mean()) if mask.any() else None,
            }
        )
    return bins


def per_class_metrics(y_true, y_pred) -> dict:
    report = classification_report(y_true, y_pred, labels=CLASSES, output_dict=True, zero_division=0)

    def block(key: str) -> dict:
        return {
            "precision": report[key]["precision"],
            "recall": report[key]["recall"],
            "f1_score": report[key]["f1-score"],
            "support": int(report[key]["support"]),
        }

    return {
        "per_class": {label: block(label) for label in CLASSES},
        "macro_avg": block("macro avg"),
        "weighted_avg": block("weighted avg"),
        "text": classification_report(y_true, y_pred, labels=CLASSES, digits=4, zero_division=0),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the BlightVision Random Forest classifier.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET, help="Folder containing Early_Blight/ and Late_Blight/")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Where to write the model and reports")
    parser.add_argument("--no-tune", action="store_true", help="Skip the hyperparameter search and use the defaults")
    parser.add_argument("--n-iter", type=int, default=10, help="Hyperparameter combinations to try (default 10)")
    parser.add_argument("--cv", type=int, default=3, help="Cross-validation folds for tuning (default 3)")
    parser.add_argument(
        "--augment", type=int, default=AUGMENT_COPIES, help=f"Augmented copies per TRAINING image (default {AUGMENT_COPIES}, 0 = off)"
    )
    parser.add_argument("--no-calibrate", action="store_true", help="Report raw Random Forest vote shares instead of calibrated probabilities")
    parser.add_argument("--n-jobs", type=int, default=-1, help="CPU cores to use (-1 = all)")
    args = parser.parse_args()

    started = time.perf_counter()
    dataset = args.dataset.resolve()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)

    log(f"\n[1/7] Loading dataset from {dataset}")
    frame, rejected = load_dataset(dataset)
    for item in rejected[:20]:
        log(f"  ! Skipped {item['file']}: {item['reason']}")
    if len(rejected) > 20:
        log(f"  ! ... and {len(rejected) - 20} more skipped files")
    class_counts = {label: int((frame["label"] == label).sum()) for label in CLASSES}
    source_counts = {
        source: {label: int(((frame["source"] == source) & (frame["label"] == label)).sum()) for label in CLASSES}
        for source in sorted(frame["source"].unique())
    }
    log(f"  Valid images: {len(frame)}  ({', '.join(f'{k}: {v}' for k, v in class_counts.items())})")
    for source, counts in source_counts.items():
        log(f"    source '{source}': {counts}")

    log("\n[2/7] Grouping duplicate / augmented images to prevent data leakage")
    hashes = Parallel(n_jobs=args.n_jobs)(delayed(invariant_hash)(path) for path in frame["path"])
    groups = group_near_duplicates(hashes)
    group_sizes = Counter(groups)
    multi = [size for size in group_sizes.values() if size > 1]
    mixed_label_groups = int(frame.groupby(groups)["label"].nunique().gt(1).sum())
    log(f"  {len(group_sizes)} groups · {len(multi)} groups contain related images ({sum(multi)} images)")
    if mixed_label_groups:
        log(f"  ! {mixed_label_groups} near-duplicate group(s) contain images from BOTH classes – check for mislabelled files.")

    log("\n[3/7] Extracting features (pretrained CNN + colour, HOG, LBP, GLCM, lesions)")
    if FEATURE_CONFIG.get("cnn"):
        import cnn_features

        if not cnn_features.onnx_path(FEATURE_CONFIG["cnn"]["backbone"]).exists():
            log(f"  Exporting the CNN feature extractor to {cnn_features.export_onnx(FEATURE_CONFIG['cnn']['backbone'])}")
        log(f"  CNN runtime: {cnn_features.runtime_name(FEATURE_CONFIG['cnn'])} (the deployed API uses the same ONNX file)")
    paths = frame["path"].to_numpy()
    images = Parallel(n_jobs=args.n_jobs, prefer="threads")(delayed(load_limited)(path) for path in paths)
    X = features_for_images(images, args.n_jobs)
    y = frame["label"].to_numpy()
    sources = frame["source"].to_numpy()
    log(f"  Feature matrix: {X.shape[0]} images x {X.shape[1]} features")

    log("\n[4/7] Splitting 80 % train / 20 % test (stratified by class and source, group-aware, random_state=42)")
    strata = np.array([f"{label}|{source}" for label, source in zip(y, sources)])
    splitter = StratifiedGroupKFold(n_splits=TEST_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    train_idx, test_idx = next(splitter.split(X, strata, groups))
    assert not set(groups[train_idx]) & set(groups[test_idx]), "group leakage between train and test"
    X_train, X_test, y_train, y_test = X[train_idx], X[test_idx], y[train_idx], y[test_idx]
    groups_train = groups[train_idx]
    log(f"  Training images: {len(train_idx)} · Testing images: {len(test_idx)}")

    if args.augment > 0:
        log(f"\n[5/7] Augmenting the TRAINING split only ({args.augment} copies per image: zoom/crop, rotation, colour, background)")
        jobs = [
            (int(i), int(train_idx[(j * 7919 + k * 104729 + 13) % len(train_idx)]), AUGMENT_SEED + j * 100 + k)
            for j, i in enumerate(train_idx)
            for k in range(args.augment)
        ]
        X_aug = augmented_feature_matrix(images, jobs, args.n_jobs)
        X_fit = np.vstack([X_train, X_aug])
        y_fit = np.concatenate([y_train, np.repeat(y_train, args.augment)])
        groups_fit = np.concatenate([groups_train, np.repeat(groups_train, args.augment)])  # copies stay in their CV group
        log(f"  Training rows: {len(train_idx)} original + {len(X_aug)} augmented = {len(X_fit)}")
    else:
        log("\n[5/7] Augmentation disabled (--augment 0)")
        X_fit, y_fit, groups_fit = X_train, y_train, groups_train

    log("\n[6/7] Training Random Forest")
    # OOB estimates are not meaningful when augmented copies of the same photo share the bootstrap pool.
    base = RandomForestClassifier(
        random_state=RANDOM_STATE, n_jobs=args.n_jobs, class_weight="balanced", bootstrap=True, oob_score=args.augment == 0
    )
    tuning: dict | None = None
    if args.no_tune:
        model = base.set_params(**DEFAULT_PARAMS).fit(X_fit, y_fit)
        log(f"  Using default hyperparameters: {DEFAULT_PARAMS}")
    else:
        cv = StratifiedGroupKFold(n_splits=args.cv, shuffle=True, random_state=RANDOM_STATE)
        search = RandomizedSearchCV(
            base,
            SEARCH_SPACE,
            n_iter=args.n_iter,
            scoring="f1_macro",
            cv=cv,
            random_state=RANDOM_STATE,
            n_jobs=1,  # the forest itself already uses all cores
            refit=True,
            return_train_score=True,
            verbose=1,
        )
        log(f"  RandomizedSearchCV: {args.n_iter} candidates x {args.cv} group-aware folds on the TRAINING split only")
        search.fit(X_fit, y_fit, groups=groups_fit)
        model = search.best_estimator_
        best = search.best_index_
        tuning = {
            "method": "RandomizedSearchCV",
            "candidates": args.n_iter,
            "cv_folds": args.cv,
            "cv_strategy": "StratifiedGroupKFold on the training split",
            "scoring": "f1_macro",
            "search_space": SEARCH_SPACE,
            "best_params": search.best_params_,
            "best_cv_f1_macro": float(search.best_score_),
            "best_cv_f1_macro_std": float(search.cv_results_["std_test_score"][best]),
            "best_cv_train_f1_macro": float(search.cv_results_["mean_train_score"][best]),
        }
        log(f"  Best params: {search.best_params_}")
        log(f"  Cross-validated macro F1 (training split): {search.best_score_:.4f}")

    forest = model
    calibration: dict | None = None
    if not args.no_calibrate:
        # A Random Forest's predict_proba is the share of trees voting for a class, which is systematically
        # under-confident (e.g. "75 %" predictions are right far more than 75 % of the time). Sigmoid (Platt)
        # scaling maps those vote shares to probabilities that match observed accuracy. It is fitted on
        # cross-validated predictions from the TRAINING split only; the test split is not used.
        log("  Calibrating probabilities (sigmoid / Platt scaling, group-aware CV on the training split)")
        cal_cv = list(StratifiedGroupKFold(n_splits=args.cv, shuffle=True, random_state=RANDOM_STATE).split(X_fit, y_fit, groups_fit))
        model = CalibratedClassifierCV(clone(forest).set_params(oob_score=False), method="sigmoid", cv=cal_cv, ensemble=False)
        model.fit(X_fit, y_fit)
        calibration = {
            "method": "sigmoid (Platt scaling)",
            "fitted_on": f"{args.cv}-fold group-aware cross-validated Random Forest votes on the training split",
            "purpose": "Makes the reported confidence match how often predictions are actually correct.",
        }

    log("\n[7/7] Evaluating on the untouched test split")
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    test_proba = model.predict_proba(X_test)
    positive_column = list(model.classes_).index(POSITIVE_CLASS)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, test_pred, average="binary", pos_label=POSITIVE_CLASS, zero_division=0)
    cm = confusion_matrix(y_test, test_pred, labels=CLASSES)
    report = per_class_metrics(y_test, test_pred)

    test_sources = sources[test_idx]
    by_source = {}
    for source in sorted(set(test_sources)):
        mask = test_sources == source
        by_source[source] = {
            "images": int(mask.sum()),
            "accuracy": float(accuracy_score(y_test[mask], test_pred[mask])),
            "macro_f1_score": float(f1_score(y_test[mask], test_pred[mask], average="macro", labels=CLASSES, zero_division=0)),
            "confusion_matrix": confusion_matrix(y_test[mask], test_pred[mask], labels=CLASSES).tolist(),
        }

    # Field-style stress test: close-up / background-swapped / re-lit versions of the TEST images
    # (backgrounds borrowed from other test images only). Reported separately – it is a simulation.
    stress_jobs = [
        (int(i), int(test_idx[(j * 31 + k * 17 + 5) % len(test_idx)]), STRESS_SEED + j * 10 + k)
        for j, i in enumerate(test_idx)
        for k in range(STRESS_COPIES)
    ]
    log("  Field-style stress test:")
    X_stress = augmented_feature_matrix(images, stress_jobs, args.n_jobs)
    y_stress = np.repeat(y_test, STRESS_COPIES)
    stress_pred = model.predict(X_stress)
    field_simulation = {
        "accuracy": float(accuracy_score(y_stress, stress_pred)),
        "macro_f1_score": float(f1_score(y_stress, stress_pred, average="macro")),
        "images": int(len(y_stress)),
        "description": (
            f"{STRESS_COPIES} simulated variations (zoomed crop, replaced background, lighting changes) "
            "of every held-out test image. A robustness indicator only."
        ),
    }

    trained_at = datetime.now(timezone.utc)
    model_version = f"RF-{trained_at:%Y%m%d-%H%M%S}"
    params = {
        key: forest.get_params()[key]
        for key in ["n_estimators", "max_depth", "min_samples_split", "min_samples_leaf", "max_features", "class_weight", "bootstrap", "criterion", "random_state"]
    }
    train_counts = {label: int((y_train == label).sum()) for label in CLASSES}
    test_counts = {label: int((y_test == label).sum()) for label in CLASSES}

    evaluation = {
        "model_version": model_version,
        "generated_at": trained_at.isoformat(),
        "positive_class": POSITIVE_CLASS,
        "classes": CLASSES,
        "training_accuracy": float(accuracy_score(y_train, train_pred)),
        "testing_accuracy": float(accuracy_score(y_test, test_pred)),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "macro_f1_score": float(f1_score(y_test, test_pred, average="macro")),
        "roc_auc": float(roc_auc_score((y_test == POSITIVE_CLASS).astype(int), test_proba[:, positive_column])),
        "oob_score": float(forest.oob_score_) if getattr(forest, "oob_score_", None) is not None else None,
        "confidence_reliability": confidence_bins(test_proba.max(axis=1), test_pred == y_test),
        "confusion_matrix": {"labels": CLASSES, "matrix": cm.tolist()},  # rows = actual, columns = predicted
        "classification_report": {k: v for k, v in report.items() if k != "text"},
        "classification_report_text": report["text"],
        "by_source": by_source,
        "dataset": {
            "total_images": int(len(frame)),
            "class_distribution": class_counts,
            "source_distribution": source_counts,
            "training_images": int(len(train_idx)),
            "testing_images": int(len(test_idx)),
            "training_distribution": train_counts,
            "testing_distribution": test_counts,
            "rejected_files": len(rejected),
            "duplicate_groups": len(multi),
            "images_in_duplicate_groups": int(sum(multi)),
            "augmented_training_rows": int(len(X_fit) - len(X_train)),
        },
        "field_simulation": field_simulation,
        "tuning": tuning,
    }

    info = {
        "algorithm": "Random Forest",
        "implementation": f"scikit-learn {sklearn.__version__} RandomForestClassifier",
        "model_version": model_version,
        "training_date": trained_at.isoformat(),
        "classes": CLASSES,
        "dataset_size": int(len(frame)),
        "train_test_split": {
            "train": 0.8,
            "test": 0.2,
            "actual_train_ratio": round(len(train_idx) / len(frame), 4),
            "actual_test_ratio": round(len(test_idx) / len(frame), 4),
            "strategy": "StratifiedGroupKFold (5 folds, one held out as test) – stratified by class and source, duplicate-aware",
            "random_state": RANDOM_STATE,
        },
        "n_estimators": int(forest.n_estimators),
        "probability_calibration": calibration,
        "hyperparameters": params,
        "feature_extraction": FEATURE_METHODS,
        "feature_count": int(X.shape[1]),
        "feature_layout": feature_layout(),
        "feature_config": FEATURE_CONFIG,
        "image_size": FEATURE_CONFIG["cnn"]["input_size"] if FEATURE_CONFIG.get("cnn") else FEATURE_CONFIG["image_size"],
        "tuned": tuning is not None,
        "augmentation": {
            "copies_per_training_image": args.augment,
            "applied_to": "training split only",
            "transforms": ["random zoom / crop", "90° rotations and flips", "brightness / contrast / saturation", "occasional blur", "background replacement with blurred real leaf tissue"],
        },
        "training_seconds": round(time.perf_counter() - started, 1),
    }

    bundle = {
        "model": model,
        "classes": CLASSES,
        "feature_config": FEATURE_CONFIG,
        "model_version": model_version,
        "trained_at": trained_at.isoformat(),
        "sklearn_version": sklearn.__version__,
    }
    # Write to temporary files first so a running API never reads a half-written model.
    for name, writer in [
        (MODEL_FILE, lambda p: joblib.dump(bundle, p, compress=3)),
        ("evaluation.json", lambda p: p.write_text(json.dumps(evaluation, indent=2), encoding="utf-8")),
        ("model_info.json", lambda p: p.write_text(json.dumps(info, indent=2), encoding="utf-8")),
    ]:
        tmp = output / f".{name}.tmp"
        writer(tmp)
        os.replace(tmp, output / name)

    log("\n" + report["text"])
    log("Confusion matrix (rows = actual, columns = predicted):")
    log(pd.DataFrame(cm, index=[f"actual {c}" for c in CLASSES], columns=[f"pred {c}" for c in CLASSES]).to_string())
    log(f"\nTraining accuracy : {evaluation['training_accuracy']:.4f}")
    log(f"Testing accuracy  : {evaluation['testing_accuracy']:.4f}")
    log(f"Precision / Recall / F1 (positive = {POSITIVE_CLASS}): {precision:.4f} / {recall:.4f} / {f1:.4f}")
    for source, stats in by_source.items():
        log(f"  Test accuracy on '{source}' images ({stats['images']}): {stats['accuracy']:.4f}")
    log(f"Field-style stress test ({field_simulation['images']} simulated images): accuracy {field_simulation['accuracy']:.4f}")
    log(f"\nSaved {MODEL_FILE}, evaluation.json and model_info.json to {output}")
    log(f"Model version {model_version} · finished in {info['training_seconds']} s\n")


if __name__ == "__main__":
    sys.exit(main())
