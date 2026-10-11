export const APP_NAME = 'BlightVision';
export const APP_TAGLINE = 'Potato Leaf Blight Disease Classification';
export const APP_VERSION = '1.0.0';

export const MODEL_URL = `${import.meta.env.BASE_URL}model/model.json`;
export const METADATA_URL = `${import.meta.env.BASE_URL}model/metadata.json`;
export const MODEL_INPUT_SIZE = 224;

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
  'The model only distinguishes Early Blight from Late Blight. It cannot recognise healthy leaves, other diseases, or non-potato images — it will always answer with one of its two classes. Analyze clear photos of potato leaves only.';

export const THEME_STORAGE_KEY = 'blightvision-theme';
