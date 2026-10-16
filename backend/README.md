# BlightVision backend – Random Forest classifier (Python + FastAPI)

This folder holds the machine-learning side of BlightVision: a scikit-learn `RandomForestClassifier` that
classifies potato leaf images as **Early Blight** or **Late Blight**, and a FastAPI server the React app calls.

```
backend/
  dataset/
    Early_Blight/          your Early Blight leaf images
    Late_Blight/           your Late Blight leaf images
  models/                  created by train_model.py
    random_forest.joblib   trained model + feature configuration
    evaluation.json        metrics from the held-out test split
    model_info.json        algorithm, hyperparameters, dataset, split
    cnn/efficientnet_b0.onnx  CNN feature extractor exported for ONNX Runtime
  feature_extraction.py    image preprocessing + numeric features (shared by training and prediction)
  cnn_features.py          frozen pretrained EfficientNet-B0 used as a feature extractor (ONNX Runtime / PyTorch)
  augmentation.py          training-only image augmentation
  train_model.py           trains, tunes, evaluates and saves the model
  prediction.py            loads the saved model and runs predict_proba()
  main.py                  FastAPI app (REST endpoints)
  requirements.txt         training + local development (includes PyTorch)
  requirements-deploy.txt  deployed API only (ONNX Runtime, no PyTorch)
```

## How it works

1. **Preprocessing** – each image is decoded with Pillow (EXIF orientation respected), converted to RGB and
   resized to 128 × 128 px with OpenCV.
2. **Feature extraction** (`feature_extraction.py`, `cnn_features.py`) – 1,971 numbers per image:
   - **1,280 CNN features** from a frozen, ImageNet-pretrained **EfficientNet-B0** (torchvision). Its
     classification head is removed and its weights are never trained; it only describes the image. The weights
     (~21 MB) download automatically the first time and are cached in `models/torch/`.
   - 691 hand-crafted features:
     - colour histograms (HSV + CIELAB, 32 bins per channel) and colour moments (mean / std / skew)
     - Histogram of Oriented Gradients (HOG) on the grayscale image (coarse 32 px cells)
     - Local Binary Pattern histograms (uniform, radius 1 and 2)
     - Grey-Level Co-occurrence Matrix (GLCM) texture statistics
     - **lesion features**: the diseased (brown / yellow / dark) tissue is segmented and described by its colour,
       the number of lesions, their size distribution, circularity and solidity.

   Large photos are first shrunk to at most 384 px on the longest side, identically in training and prediction.
3. **Classification** – a Random Forest votes on the class; `predict_proba()` gives the probability for each class.
   No feature scaling is used (trees do not need it). The Random Forest is the only part that is trained.
4. **Probability calibration** – a Random Forest's raw `predict_proba` is the share of trees voting for a class,
   which is systematically under-confident (in testing, raw "70–80 %" predictions were right ~97 % of the time).
   `train_model.py` therefore wraps the forest in scikit-learn's `CalibratedClassifierCV` with **sigmoid (Platt)
   scaling**, fitted on group-aware cross-validated predictions from the training split only. The reported
   confidence is the calibrated `predict_proba()` of that Random Forest model. Use `--no-calibrate` to report raw
   vote shares instead. The Model Evaluation page shows a *Confidence Reliability* table (how often predictions
   in each confidence band were actually correct on the test split).

### Dataset sources

The dataset used to train the current model is **1,000 Early Blight + 1,000 Late Blight field photos**, placed
directly in `dataset/Early_Blight/` and `dataset/Late_Blight/`. They are smartphone photos taken on smallholder
potato farms (natural backgrounds, varied light and zoom), selected from:

> *Irish potato imagery dataset for detection of early and late blight diseases* (Tanzania), Zenodo DOI
> [10.5281/zenodo.8286529](https://zenodo.org/records/8286529), licensed **CC BY 4.0** – credit the authors
> when you use or publish results based on it.

The 1,000 per class were chosen to cover as many *different* leaves as possible (one photo per near-duplicate
group first), so the dataset is not dominated by repeated shots of the same leaf.

Optional: if you add images in a **sub-folder** of a class folder (e.g. `Early_Blight/my_photos/`), the
sub-folder name becomes a "source", the split is stratified by class and source, and the Model Evaluation page
shows test accuracy per source.

The exact same feature code runs during training, testing and live prediction. The feature settings are saved
inside `random_forest.joblib`, and the API refuses a model trained with an incompatible feature layout.

### Training safeguards

- **80 / 20 stratified split** with `random_state=42`.
- **No data leakage:** flipped / rotated / near-identical copies of the same image are detected with a
  rotation-invariant perceptual hash and kept on the same side of the split (`StratifiedGroupKFold`).
- **Augmentation of the training split only** (`augmentation.py`, `--augment 2` by default): each training photo
  gets 2 variations – random zoom / crop, rotation / flip, brightness / contrast / saturation, occasional blur, and
  replacement of the grey studio background with blurred real leaf tissue from another training photo. This
  teaches the model what close-ups with natural backgrounds look like. Copies stay in their original's CV group.
  Test images are never augmented for the reported metrics.
- **Field-style stress test:** in addition to the normal test metrics, the script reports accuracy on simulated
  field-style versions of the *test* images. It is a robustness indicator, not a substitute for real field photos.
- **Hyperparameter tuning only on the training split:** `RandomizedSearchCV` (10 candidates × 3 group-aware folds,
  scored by macro F1) over `n_estimators`, `max_depth`, `min_samples_split`, `min_samples_leaf`, `max_features`.
  Depth and leaf-size limits keep tree complexity in check.
- **The test split is used once**, for the final evaluation.
- **Positive class** for binary precision / recall / F1 is **Late Blight** (the costlier disease to miss).
  Per-class and macro-averaged figures are reported as well.

Every number in `evaluation.json` is computed by scikit-learn from real predictions. Nothing is hardcoded.

## Setup on Windows (VS Code)

Open the project folder in VS Code and open a terminal (**Terminal → New Terminal**, PowerShell).
Python 3.11 – 3.13 is supported (`python --version`).

### 1. Create a virtual environment and install dependencies

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks `Activate.ps1`, run once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
(or skip activation and call `.\.venv\Scripts\python.exe` directly).

In VS Code, press **Ctrl+Shift+P → Python: Select Interpreter** and pick `backend\.venv\Scripts\python.exe`.

### 2. Put the dataset in place

```
backend\dataset\Early_Blight\   *.jpg / *.jpeg / *.png / *.webp / *.bmp
backend\dataset\Late_Blight\    ...
```

Folder names are matched case-insensitively (`early_blight`, `Early Blight` and `Early_Blight` all work).
Unreadable or tiny files are skipped and listed in the training log. Each class needs at least 10 images; for
reliable results use hundreds per class, photographed the way your users will photograph leaves.

### 3. Train the model

```powershell
python train_model.py              # with augmentation + hyperparameter search (roughly 20–40 minutes for 4,000 images on a laptop CPU)
python train_model.py --no-tune    # faster: train once with default hyperparameters
```

Options: `--dataset PATH`, `--output PATH`, `--n-iter 10`, `--cv 3`, `--augment 2` (0 = off), `--n-jobs -1`.
The script prints the classification report and confusion matrix, then writes the three files in `models/`.

### 4. Start the API

```powershell
python -m uvicorn main:app --reload --port 8000
```

- API docs (try requests in the browser): <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health>

Keep this terminal open while you use the app.

### 5. Start the React frontend (second terminal, project root)

```powershell
npm install
npm run dev
```

Make sure the root `.env` contains `VITE_API_BASE_URL=http://localhost:8000`, then open <http://localhost:5173>.

### 6. Test it

- **Detection page** – the side card should say *Random Forest model ready*. Upload a leaf image and click
  *Analyze Image*; the result shows the predicted disease, confidence and both class probabilities.
- **Model Evaluation page** – shows the training / testing accuracy, precision, recall, F1, confusion matrix,
  classification report, dataset distribution and model information read from the API.
- **Automated check** (with both servers running): `npm run verify:model` drives the app in Edge/Chrome and
  confirms the percentages on screen equal the backend's `predict_proba()` output.
- **From the command line:**
  `curl.exe -F "file=@dataset/Late_Blight/late_blight_0001.jpg" http://localhost:8000/api/predict`

## Retraining when the dataset changes

1. Add, remove or fix images in `dataset/Early_Blight` and `dataset/Late_Blight`.
2. Run `python train_model.py` again.
3. That's it – the running API notices the new `random_forest.joblib` and uses it on the next request (no restart
   needed). Click *Refresh* on the Model Evaluation page to see the new metrics. Each training run gets a new model
   version (e.g. `RF-20261015-124145`), which is stored with every scan saved afterwards.

## Deploying the backend to Render (free)

Vercel only hosts the React frontend; the Python backend runs as a free **Render web service**, configured
by `render.yaml` in the repository root.

The deployed API does **not** use PyTorch. It installs `requirements-deploy.txt` and runs the same
EfficientNet-B0 from `models/cnn/efficientnet_b0.onnx` with **ONNX Runtime** (peak memory ~230 MB, within the
free 512 MB). Image preprocessing is shared code, so predictions are identical to local ones (verified on all
2,000 dataset images: 0 changed classes, 0.00 % confidence difference).

1. Commit and push the project to GitHub (the trained files in `models/` – `random_forest.joblib`,
   `evaluation.json`, `model_info.json`, `cnn/efficientnet_b0.onnx` – must be included).
2. Sign in at <https://render.com> with GitHub → **New → Blueprint** → choose the repository → **Apply**.
3. Wait for the deploy to finish, then open `https://<service-name>.onrender.com/api/health`.
4. In **Vercel → Project → Settings → Environment Variables**, add
   `VITE_API_BASE_URL = https://<service-name>.onrender.com` (no trailing slash), then **Redeploy**.

CORS already allows every `https://*.vercel.app` site. For a custom domain, add it to `CORS_ORIGINS` in the
Render service's *Environment* settings. After retraining, commit and push the updated `models/` files –
Render redeploys automatically. Free services sleep after 15 minutes without traffic and take about a minute
to wake; the website keeps retrying automatically while it wakes.

## API reference

| Method & path | Description |
| --- | --- |
| `GET /api/health` | Service status, whether a trained model is loaded, model version |
| `POST /api/predict` | Multipart field `file` (JPEG / PNG / WEBP, ≤ 10 MB). Returns `predicted_class`, `confidence`, `probabilities`, `model`, `model_version`, `inference_ms` |
| `GET /api/model/evaluation` | Contents of `models/evaluation.json` |
| `GET /api/model/info` | Contents of `models/model_info.json` plus `model_loaded` |

Errors return JSON `{"detail": "..."}`: `415` unsupported type, `413` too large, `400` empty file, `422` not a
decodable image, `503` (`"code": "model_not_trained"`) when no model has been trained yet, `500` unexpected errors.

`confidence` is the Random Forest's probability for the predicted class (the share of tree votes). It is **not** a
guarantee that the prediction is correct.

## Configuration

Optional `backend/.env` (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173` | Frontend origins allowed to call the API |
| `MAX_UPLOAD_MB` | `10` | Maximum upload size |

If you open the app from a phone on your network (e.g. `http://192.168.1.20:5173`), add that origin to
`CORS_ORIGINS`, set `VITE_API_BASE_URL=http://192.168.1.20:8000`, and start uvicorn with `--host 0.0.0.0`.

## Limitations

- The model knows only Early Blight and Late Blight. It has **no healthy class** and cannot reject unrelated
  images – any image receives one of the two labels.
- It learns from the photos it is trained on. The current dataset is field photos from one region (Tanzania);
  photos that look very different (studio shots, other potato varieties, unusual lighting) may get lower
  confidence. Adding your own labelled photos and retraining is the most effective way to improve it.
