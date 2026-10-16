"""
BlightVision FastAPI backend – serves the trained Random Forest classifier.

    uvicorn main:app --reload --port 8000

Environment variables (optional, see .env.example):
    CORS_ORIGINS        comma-separated list of allowed frontend origins
    CORS_ORIGIN_REGEX   optional regex of additional allowed origins (e.g. Vercel deployments)
    MAX_UPLOAD_MB       maximum upload size in megabytes (default 10)
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from prediction import EVALUATION_PATH, INFO_PATH, ModelNotAvailableError, Predictor, read_json


def _load_env_file() -> None:
    """Minimal .env support so no extra dependency is needed. Real environment variables win."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file()

API_VERSION = "2.0.0"
MAX_UPLOAD_BYTES = int(float(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024)
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
    ).split(",")
    if origin.strip()
]
# Optional regular expression for extra allowed origins, e.g. https://.*[.]vercel[.]app for Vercel deployments.
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX") or None

logger = logging.getLogger("blightvision")
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")

predictor = Predictor()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load the model once at start-up so the first prediction is not slowed down.
    if predictor.is_available():
        logger.info("Random Forest model %s loaded", predictor.model_version)
    else:
        logger.warning("No trained model available yet – run `python train_model.py`. %s", predictor.load_error or "")
    logger.info("CORS allowed origins: %s%s", ", ".join(CORS_ORIGINS), f" + regex {CORS_ORIGIN_REGEX}" if CORS_ORIGIN_REGEX else "")
    yield


app = FastAPI(
    title="BlightVision API",
    version=API_VERSION,
    description="Potato leaf Early Blight / Late Blight classification with a scikit-learn Random Forest.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(ModelNotAvailableError)
async def model_missing_handler(_: Request, exc: ModelNotAvailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc), "code": "model_not_trained"})


@app.exception_handler(Exception)
async def unexpected_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error")
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred.", "code": "server_error"})


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": "BlightVision API", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health() -> dict:
    available = predictor.is_available()
    return {
        "status": "ok",
        "api_version": API_VERSION,
        "model_available": available,
        "model": "Random Forest",
        "model_version": predictor.model_version if available else None,
        "evaluation_available": EVALUATION_PATH.exists(),
        "detail": None if available else (predictor.load_error or "No trained model found. Run `python train_model.py`."),
    }


@app.post("/api/predict")
def predict(file: UploadFile = File(..., description="Potato leaf image (JPEG, PNG or WEBP, max 10 MB)")) -> dict:
    filename = file.filename or ""
    extension = os.path.splitext(filename)[1].lower()
    if file.content_type not in ALLOWED_TYPES and extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported file type. Upload a JPEG, PNG or WEBP image.")

    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"The image is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    try:
        result = predictor.predict(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    logger.info("Predicted %s (%.4f) for %s", result["predicted_class"], result["confidence"], filename or "upload")
    return result


@app.get("/api/model/evaluation")
def model_evaluation() -> dict:
    return read_json(EVALUATION_PATH)


@app.get("/api/model/info")
def model_info() -> dict:
    info = read_json(INFO_PATH)
    info["model_loaded"] = predictor.is_available()
    return info
