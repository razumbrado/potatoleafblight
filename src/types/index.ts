export const DISEASES = ['Early Blight', 'Late Blight'] as const;
export type Disease = (typeof DISEASES)[number];

/**
 * Result of a single Random Forest inference from the Python backend.
 * All probabilities are 0–1, straight from `predict_proba()`.
 */
export interface ClassificationResult {
  predictedDisease: Disease;
  confidence: number;
  earlyBlightProbability: number;
  lateBlightProbability: number;
  modelName: string;
  modelVersion: string;
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
  /** Null for scans saved before the Random Forest migration (legacy Teachable Machine model). */
  model_name?: string | null;
  model_version?: string | null;
}

/** Row of public.profiles */
export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

/** GET /api/health */
export interface BackendHealth {
  status: string;
  api_version: string;
  model_available: boolean;
  model: string;
  model_version: string | null;
  evaluation_available: boolean;
  detail: string | null;
}

/** GET /api/model/info – written by backend/train_model.py */
export interface ModelInfo {
  algorithm: string;
  implementation: string;
  model_version: string;
  training_date: string;
  classes: string[];
  dataset_size: number;
  train_test_split: {
    train: number;
    test: number;
    actual_train_ratio: number;
    actual_test_ratio: number;
    strategy: string;
    random_state: number;
  };
  n_estimators: number;
  /** Null / absent when the model reports raw Random Forest vote shares. */
  probability_calibration?: { method: string; fitted_on: string; purpose: string } | null;
  hyperparameters: Record<string, string | number | boolean | null>;
  feature_extraction: string[];
  feature_count: number;
  feature_layout: Record<string, number>;
  image_size: number;
  tuned: boolean;
  training_seconds: number;
  model_loaded: boolean;
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

/** GET /api/model/evaluation – every value is computed by train_model.py on the held-out test split. */
export interface ModelEvaluation {
  model_version: string;
  generated_at: string;
  positive_class: Disease;
  classes: Disease[];
  training_accuracy: number;
  testing_accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  macro_f1_score: number;
  roc_auc: number | null;
  oob_score: number | null;
  confusion_matrix: { labels: Disease[]; matrix: number[][] };
  classification_report: {
    per_class: Record<Disease, ClassMetrics>;
    macro_avg: ClassMetrics;
    weighted_avg: ClassMetrics;
  };
  classification_report_text: string;
  dataset: {
    total_images: number;
    class_distribution: Record<Disease, number>;
    training_images: number;
    testing_images: number;
    training_distribution: Record<Disease, number>;
    testing_distribution: Record<Disease, number>;
    rejected_files: number;
    duplicate_groups: number;
    images_in_duplicate_groups: number;
    source_distribution?: Record<string, Record<Disease, number>>;
    /** Augmented copies of training images added for training (0 / absent for older models). */
    augmented_training_rows?: number;
  };
  /** How often test predictions in each confidence band were actually correct (newer models only). */
  confidence_reliability?: { range: [number, number]; images: number; accuracy: number | null }[];
  /** Test metrics per image source (dataset sub-folder), e.g. PlantVillage vs field photos (newer models only). */
  by_source?: Record<string, { images: number; accuracy: number; macro_f1_score: number; confusion_matrix: number[][] }>;
  /** Robustness check on simulated field-style versions of the test images (newer models only). */
  field_simulation?: {
    accuracy: number;
    macro_f1_score: number;
    images: number;
    description: string;
  };
  tuning: {
    method: string;
    candidates: number;
    cv_folds: number;
    cv_strategy: string;
    scoring: string;
    best_params: Record<string, string | number | null>;
    best_cv_f1_macro: number;
    best_cv_f1_macro_std: number;
    best_cv_train_f1_macro: number;
  } | null;
}
