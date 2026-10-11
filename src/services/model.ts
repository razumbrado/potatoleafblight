import { METADATA_URL, MODEL_URL } from '@/lib/constants';
import type { ClassificationResult, ClassProbability, Disease, ModelInfo } from '@/types';

/** Minimal shape of the object returned by tmImage.load(). */
interface TeachableMachineModel {
  getTotalClasses(): number;
  getClassLabels(): string[];
  predict(image: HTMLImageElement | HTMLCanvasElement, flipped?: boolean): Promise<ClassProbability[]>;
}

let modelPromise: Promise<{ model: TeachableMachineModel; info: ModelInfo }> | null = null;

const normalise = (label: string) => label.trim().toLowerCase().replace(/[\s_-]+/g, ' ');

async function fetchMetadata(): Promise<Partial<ModelInfo>> {
  const response = await fetch(METADATA_URL);
  if (!response.ok) throw new Error(`Could not load model metadata (HTTP ${response.status}).`);
  return (await response.json()) as Partial<ModelInfo>;
}

async function loadInternal() {
  const started = performance.now();

  // Loaded lazily so TensorFlow.js is only downloaded when the detection workspace needs it.
  const [tmModule, tf, metadata] = await Promise.all([
    import('@teachablemachine/image'),
    import('@tensorflow/tfjs'),
    fetchMetadata(),
  ]);
  // The library is published as CommonJS; depending on the bundler it may sit under `default`.
  const tmImage = ('load' in tmModule ? tmModule : (tmModule as { default: unknown }).default) as {
    load(modelUrl: string, metadataUrl: string): Promise<TeachableMachineModel>;
  };

  await tf.ready();
  const model = await tmImage.load(MODEL_URL, METADATA_URL);

  const labels = model.getClassLabels();
  const known = labels.map(normalise);
  if (!known.includes('early blight') || !known.includes('late blight')) {
    throw new Error(
      `The model in public/model has unexpected classes (${labels.join(', ')}). BlightVision expects "Early Blight" and "Late Blight".`,
    );
  }

  const info: ModelInfo = {
    labels,
    imageSize: metadata.imageSize ?? 224,
    tfjsVersion: metadata.tfjsVersion,
    tmVersion: metadata.tmVersion,
    packageName: metadata.packageName,
    packageVersion: metadata.packageVersion,
    modelName: metadata.modelName,
    timeStamp: metadata.timeStamp,
    backend: tf.getBackend(),
    loadTimeMs: Math.round(performance.now() - started),
  };
  return { model, info };
}

/** Loads the Teachable Machine model once; concurrent and repeat calls share the same promise. */
export function loadModel() {
  if (!modelPromise) {
    modelPromise = loadInternal().catch((error) => {
      modelPromise = null; // allow retry
      throw error;
    });
  }
  return modelPromise;
}

/**
 * Runs the real model on an image element and returns its unmodified output.
 * No values are invented, rounded, or adjusted here.
 */
export async function classifyImage(image: HTMLImageElement | HTMLCanvasElement): Promise<ClassificationResult> {
  const { model } = await loadModel();
  const predictions = await model.predict(image);

  const find = (label: string) => predictions.find((p) => normalise(p.className) === label);
  const early = find('early blight');
  const late = find('late blight');
  if (!early || !late) throw new Error('The model returned an unexpected set of classes.');
  if (!Number.isFinite(early.probability) || !Number.isFinite(late.probability)) {
    throw new Error('The model returned an invalid probability. Please try another image.');
  }

  const predictedDisease: Disease = early.probability >= late.probability ? 'Early Blight' : 'Late Blight';

  return {
    predictedDisease,
    confidence: Math.max(early.probability, late.probability),
    earlyBlightProbability: early.probability,
    lateBlightProbability: late.probability,
    raw: predictions.map((p) => ({ className: p.className, probability: p.probability })),
    analyzedAt: new Date().toISOString(),
  };
}
