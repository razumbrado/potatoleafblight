import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Camera, FileImage, ImagePlus, Lightbulb, RotateCcw, ScanLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Notice } from '@/components/common/Notice';
import { PageHeader } from '@/components/common/PageHeader';
import { AnalyzingOverlay } from '@/components/detection/AnalyzingOverlay';
import { CameraCapture } from '@/components/detection/CameraCapture';
import { ModelStatusCard } from '@/components/detection/ModelStatusCard';
import { ACCEPT_ATTRIBUTE, UploadZone } from '@/components/detection/UploadZone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDetection } from '@/contexts/DetectionContext';
import { useModel } from '@/contexts/ModelContext';
import { MODEL_SCOPE_NOTE } from '@/lib/constants';
import { CAPTURE_TIPS } from '@/lib/diseases';
import { formatFileSize, getErrorMessage } from '@/utils/format';
import { loadImageElement, validateImageFile } from '@/utils/image';

/** Keeps the scanning animation visible long enough to read; the result itself is never delayed artificially beyond this. */
const MIN_ANALYZING_MS = 900;

export function DetectionPage() {
  const navigate = useNavigate();
  const { file, previewUrl, result, setImage, setResult, reset } = useDetection();
  const { status, classify, reload } = useModel();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const modelReady = status === 'ready';

  const acceptFile = async (candidate: File) => {
    const problem = validateImageFile(candidate);
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    // Decode once up-front so renamed or corrupted files are caught before analysis.
    const probeUrl = URL.createObjectURL(candidate);
    try {
      await loadImageElement(probeUrl);
    } catch (cause) {
      const message = getErrorMessage(cause, 'This file is not a readable image.');
      setError(message);
      toast.error(message);
      return;
    } finally {
      URL.revokeObjectURL(probeUrl);
    }
    setError(null);
    setImage(candidate);
  };

  const handleReset = () => {
    reset();
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file || !previewUrl) {
      setError('Choose or capture a potato leaf image first.');
      return;
    }
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    if (!modelReady) {
      const message =
        status === 'error'
          ? 'The AI model failed to load, so the image cannot be analyzed yet. Retry loading the model.'
          : 'The AI model is still loading. Analysis will be available in a moment.';
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setAnalyzing(true);
    const started = performance.now();
    try {
      const image = await loadImageElement(previewUrl);
      const prediction = await classify(image);
      const remaining = MIN_ANALYZING_MS - (performance.now() - started);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      setResult(prediction);
      navigate('/results');
    } catch (cause) {
      const message = getErrorMessage(cause, 'The image could not be analyzed.');
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="AI workspace"
        title="Potato Leaf Detection"
        description="Upload or capture a clear photo of a potato leaf, then run the trained model to classify it as Early Blight or Late Blight."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Card className="p-4 sm:p-5">
            <AnimatePresence mode="wait" initial={false}>
              {!file || !previewUrl ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <UploadZone
                    onFile={(candidate) => void acceptFile(candidate)}
                    onOpenCamera={() => setCameraOpen(true)}
                    onReject={(message) => {
                      setError(message);
                      toast.error(message);
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="relative overflow-hidden rounded-3xl bg-forest">
                    <img
                      src={previewUrl}
                      alt="Selected potato leaf preview"
                      className="mx-auto max-h-[520px] min-h-[280px] w-full object-contain"
                      data-testid="image-preview"
                    />
                    <AnalyzingOverlay active={analyzing} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <FileImage className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                        <p className="text-xs text-ink-faint">
                          {formatFileSize(file.size)} · {file.type.replace('image/', '').toUpperCase() || 'IMAGE'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={replaceInputRef}
                        type="file"
                        accept={ACCEPT_ATTRIBUTE}
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden
                        onChange={(event) => {
                          const next = event.target.files?.[0];
                          if (next) void acceptFile(next);
                          event.target.value = '';
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={analyzing}
                        onClick={() => replaceInputRef.current?.click()}
                        icon={<ImagePlus className="h-4 w-4" />}
                      >
                        Replace Image
                      </Button>
                      <Button size="sm" variant="outline" disabled={analyzing} onClick={() => setCameraOpen(true)} icon={<Camera className="h-4 w-4" />}>
                        Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={analyzing}
                        onClick={handleReset}
                        className="text-danger hover:bg-danger-soft hover:text-danger"
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Remove Image
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <Notice tone="danger" className="mt-4" title="We couldn’t use that">
                <span data-testid="detection-error">{error}</span>
                {status === 'error' && (
                  <Button size="sm" variant="outline" className="ml-0 mt-3 block" onClick={reload}>
                    Retry loading the model
                  </Button>
                )}
              </Notice>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm text-ink-muted">
                {!file
                  ? 'Add an image to enable analysis.'
                  : !modelReady
                    ? status === 'error'
                      ? 'The model is unavailable — retry loading it to continue.'
                      : 'Waiting for the AI model to finish loading…'
                    : result
                      ? 'This image has already been analyzed. You can view the result or run it again.'
                      : 'Ready when you are — nothing is analyzed until you click Analyze Image.'}
              </p>
              <div className="flex shrink-0 flex-wrap gap-2.5">
                <Button variant="outline" onClick={handleReset} disabled={analyzing || (!file && !error)} icon={<RotateCcw className="h-4 w-4" />}>
                  Reset
                </Button>
                {result && file && !analyzing && (
                  <Link
                    to="/results"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent-soft px-5 text-sm font-semibold text-accent transition hover:brightness-95"
                  >
                    View Result
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <Button
                  onClick={() => void handleAnalyze()}
                  disabled={!file || !modelReady}
                  loading={analyzing}
                  icon={<ScanLine className="h-4 w-4" />}
                  data-testid="analyze-button"
                >
                  {analyzing ? 'Analyzing…' : 'Analyze Image'}
                </Button>
              </div>
            </div>
          </Card>

          <Notice tone="warning" title="Analyze clear potato leaf images only">
            {MODEL_SCOPE_NOTE}
          </Notice>
        </div>

        <aside className="space-y-5">
          <ModelStatusCard />
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Lightbulb className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="text-base font-bold text-ink">Tips for a useful photo</h2>
            </div>
            <ul className="space-y-3.5">
              {CAPTURE_TIPS.slice(0, 4).map((tip, index) => (
                <li key={tip.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-bold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{tip.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{tip.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/diseases#capture-tips" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              More guidance in the Disease Library
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>
        </aside>
      </div>

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(captured) => void acceptFile(captured)} />
    </div>
  );
}
