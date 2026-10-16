import { api } from '@/services/api';
import type { ClassificationResult, Disease } from '@/types';

const isProbability = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * Sends the image to the Python backend, where the trained Random Forest classifies it,
 * and returns the backend's output unchanged. No values are invented, rounded, or adjusted here.
 */
export async function classifyImage(file: File): Promise<ClassificationResult> {
  const response = await api.predict(file);

  const early = response.probabilities?.['Early Blight'];
  const late = response.probabilities?.['Late Blight'];
  if (!isProbability(early) || !isProbability(late) || !isProbability(response.confidence)) {
    throw new Error('The classification server returned an invalid probability. Please try another image.');
  }
  if (response.predicted_class !== 'Early Blight' && response.predicted_class !== 'Late Blight') {
    throw new Error(`The classification server returned an unexpected class (${response.predicted_class}).`);
  }

  return {
    predictedDisease: response.predicted_class as Disease,
    confidence: response.confidence,
    earlyBlightProbability: early,
    lateBlightProbability: late,
    modelName: response.model,
    modelVersion: response.model_version,
    analyzedAt: new Date().toISOString(),
  };
}
