import { API_BASE_URL } from '@/lib/constants';
import type { BackendHealth, ModelEvaluation, ModelInfo } from '@/types';

const DEFAULT_TIMEOUT_MS = 15_000;
const PREDICT_TIMEOUT_MS = 30_000;

/** An error from the BlightVision Python backend, with a message that can be shown to users. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The backend is reachable but train_model.py has not produced a model yet. */
  get modelNotTrained() {
    return this.code === 'model_not_trained';
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new ApiError(`The classification server did not respond within ${Math.round(timeoutMs / 1000)} seconds.`, null, 'timeout');
    }
    throw new ApiError(
      `Cannot reach the classification server at ${API_BASE_URL}. Make sure the Python backend is running (see backend/README.md).`,
      null,
      'unreachable',
    );
  } finally {
    window.clearTimeout(timer);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }

  if (!response.ok) {
    const detail = body && typeof body === 'object' && 'detail' in body ? (body as { detail: unknown }).detail : null;
    const code = body && typeof body === 'object' && 'code' in body ? String((body as { code: unknown }).code) : undefined;
    const message = typeof detail === 'string' ? detail : `The classification server returned an error (HTTP ${response.status}).`;
    throw new ApiError(message, response.status, code);
  }
  if (body === null) throw new ApiError('The classification server returned an unreadable response.', response.status);
  return body as T;
}

export interface PredictResponse {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  model: string;
  model_version: string;
  inference_ms: number;
}

export const api = {
  health: () => request<BackendHealth>('/api/health', {}, 15_000),
  modelInfo: () => request<ModelInfo>('/api/model/info'),
  evaluation: () => request<ModelEvaluation>('/api/model/evaluation'),
  predict: (file: File) => {
    const form = new FormData();
    form.append('file', file, file.name || 'leaf.jpg');
    return request<PredictResponse>('/api/predict', { method: 'POST', body: form }, PREDICT_TIMEOUT_MS);
  },
};
