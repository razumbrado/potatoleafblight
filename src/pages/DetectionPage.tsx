import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Camera, ChevronRight, FileImage, ImagePlus, RotateCcw, ScanLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Notice } from '@/components/common/Notice';
import { IosLargeTitle, IosSection, pillPrimary, pillSecondary } from '@/components/ios/Ios';
import { AnalyzingOverlay } from '@/components/detection/AnalyzingOverlay';
import { CameraCapture } from '@/components/detection/CameraCapture';
import { ACCEPT_ATTRIBUTE, UploadZone } from '@/components/detection/UploadZone';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { useDetection } from '@/contexts/DetectionContext';
import { useModel } from '@/contexts/ModelContext';
import { DISEASE_LIST } from '@/lib/diseases';
import { cn } from '@/utils/cn';
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
          ? 'The classification server or its trained model is unavailable, so the image cannot be analyzed yet. Check the backend and retry.'
          : 'Still connecting to the classification server. Analysis will be available in a moment.';
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setAnalyzing(true);
    const started = performance.now();
    try {
      const prediction = await classify(file);
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

  const statusText = !file
    ? 'Add an image to enable analysis.'
    : !modelReady
      ? status === 'error'
        ? 'The model server is unavailable or still waking up — retrying automatically…'
        : 'Connecting to the Random Forest model server (this can take a minute if it was asleep)…'
      : result
        ? 'This image has already been analyzed. You can view the result or run it again.'
        : 'Ready when you are — nothing is analyzed until you click Analyze Image.';

  return (
    <div>
      <IosLargeTitle
        title="Potato Leaf"
        highlight="Detection"
        subtitle="Upload or capture a clear photo of a potato leaf, then run the trained Random Forest model to classify it as Early Blight or Late Blight."
      />

      <div data-model-status={status} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
        <IosSection className="flex flex-col" bodyClassName="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <AnimatePresence mode="wait" initial={false}>
              {!file || !previewUrl ? (
                <motion.div
                  key="empty"
                  className="flex flex-1 flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
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
                  <div className="relative overflow-hidden rounded-[20px] bg-subtle">
                    <img
                      src={previewUrl}
                      alt="Selected potato leaf preview"
                      className="mx-auto max-h-[520px] min-h-[280px] w-full object-contain"
                      data-testid="image-preview"
                    />
                    <AnalyzingOverlay active={analyzing} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-pine-100 text-pine-700 dark:bg-subtle dark:text-pine-300">
                        <FileImage className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-pine-900 dark:text-ink">{file.name}</p>
                        <p className="text-[13px] text-ink-faint">
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
                        className={pillSecondary}
                      >
                        Replace Image
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={analyzing}
                        onClick={() => setCameraOpen(true)}
                        icon={<Camera className="h-4 w-4" />}
                        className={pillSecondary}
                      >
                        Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={analyzing}
                        onClick={handleReset}
                        className="rounded-full text-danger hover:bg-danger-soft hover:text-danger"
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
              <Notice tone="danger" className="mt-3" title="We couldn’t use that">
                <span data-testid="detection-error">{error}</span>
                {status === 'error' && (
                  <Button size="sm" variant="outline" className="ml-0 mt-3 block rounded-full" onClick={reload}>
                    Reconnect to the model server
                  </Button>
                )}
              </Notice>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-pine-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-line">
            <p className="min-w-0 text-[13px] text-ink-muted">{statusText}</p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={analyzing || (!file && !error)}
              icon={<RotateCcw className="h-4 w-4" />}
              className="rounded-full text-pine-700 hover:bg-pine-100/60 hover:text-pine-900 dark:text-pine-300"
            >
              Reset
            </Button>
            {result && file && !analyzing && (
              <Link to="/results" className={buttonStyles({ variant: 'outline', className: pillSecondary })}>
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
              className={cn(pillPrimary, 'pl-5 pr-1.5')}
              iconRight={
                <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              }
            >
              {analyzing ? 'Analyzing…' : 'Analyze Image'}
            </Button>
            </div>
          </div>
        </IosSection>

        <aside className="min-w-0">
          <Card>
            <CardHeader title="Disease quick reference" description="The two classes the model can predict" icon={<BookOpen />} />
            <ul className="space-y-2.5">
              {DISEASE_LIST.map((disease) => {
                const isEarly = disease.name === 'Early Blight';
                return (
                  <li key={disease.slug}>
                    <Link
                      to={`/diseases#${disease.slug}`}
                      className="group flex items-center gap-3.5 rounded-2xl border border-line bg-surface-alt p-2.5 transition-colors hover:border-line-strong"
                    >
                      <img
                        src={disease.image.src}
                        alt={disease.image.alt}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-bold text-ink">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', isEarly ? 'bg-early' : 'bg-late')} aria-hidden />
                          {disease.name}
                        </p>
                        <p className="text-xs italic text-ink-faint">{disease.agent}</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{disease.tagline}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link to="/diseases" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline">
              Open the Disease Library
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>
        </aside>
      </div>

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(captured) => void acceptFile(captured)} />
    </div>
  );
}
