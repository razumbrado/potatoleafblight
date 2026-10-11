export const DISEASES = ['Early Blight', 'Late Blight'] as const;
export type Disease = (typeof DISEASES)[number];

/** One class output of the Teachable Machine model. Probability is 0–1. */
export interface ClassProbability {
  className: string;
  probability: number;
}

/** Result of a single model inference. All probabilities are 0–1, straight from the model. */
export interface ClassificationResult {
  predictedDisease: Disease;
  confidence: number;
  earlyBlightProbability: number;
  lateBlightProbability: number;
  /** Raw per-class output exactly as returned by model.predict(). */
  raw: ClassProbability[];
  analyzedAt: string;
}

/** Row of public.scan_history */
export interface ScanRecord {
  id: string;
  user_id: string;
  image_path: string;
  predicted_disease: Disease;
  confidence: number;
  early_blight_probability: number;
  late_blight_probability: number;
  scanned_at: string;
}

/** Row of public.profiles */
export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ModelInfo {
  labels: string[];
  imageSize: number;
  tfjsVersion?: string;
  tmVersion?: string;
  packageName?: string;
  packageVersion?: string;
  modelName?: string;
  timeStamp?: string;
  backend?: string;
  loadTimeMs?: number;
}
