export const APP_NAME = 'BlightVision';
export const APP_TAGLINE = 'Potato Leaf Blight Disease Classification';
export const APP_VERSION = '2.0.0';

/** Base URL of the Python FastAPI backend that runs the Random Forest model. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000').replace(/\/+$/, '');


export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/**
 * Below this top-class probability the UI adds a "low confidence" note.
 * It is only a prompt to retake the photo — never proof an image is invalid.
 */
export const LOW_CONFIDENCE_THRESHOLD = 0.75;

export const MODEL_DISCLAIMER =
  'This result is a prediction from a machine-learning model, not a confirmed plant disease diagnosis. Consult a qualified agronomist or plant pathologist before making crop management decisions.';

export const MODEL_SCOPE_NOTE =
  'This Random Forest model is intended for potato leaf images suspected of Early Blight or Late Blight. It was trained on those two classes only, so it cannot recognise healthy leaves, other diseases, or non-potato images — it will always answer with one of its two classes. Analyze clear photos of potato leaves only.';

export const THEME_STORAGE_KEY = 'blightvision-theme';
