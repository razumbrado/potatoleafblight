import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Bug, CalendarClock, CheckCircle2, CloudSun, Cpu, ImageOff, ListChecks, ShieldCheck, Sprout, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/common/Notice';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { LOW_CONFIDENCE_THRESHOLD, MODEL_DISCLAIMER, MODEL_SCOPE_NOTE } from '@/lib/constants';
import { DISEASE_INFO } from '@/lib/diseases';
import type { Disease } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatPercent } from '@/utils/format';
import { ProbabilityBar } from './ProbabilityBar';

export interface ResultReportProps {
  imageUrl?: string;
  imageLoading?: boolean;
  predictedDisease: Disease;
  /** All probabilities are the model's raw outputs, 0–1. */
  confidence: number;
  earlyBlightProbability: number;
  lateBlightProbability: number;
  dateIso: string;
  /** Extra line under the date, e.g. "Saved to your history". */
  statusLabel?: string;
  /** Which model produced the result, e.g. "Random Forest · RF-20261015-101500". */
  modelLabel: string;
  /** True for scans saved with the earlier Teachable Machine model. */
  legacyModel?: boolean;
}

function InfoList({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        <h3 className="text-base font-bold text-ink">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-soft" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ResultReport({
  imageUrl,
  imageLoading,
  predictedDisease,
  confidence,
  earlyBlightProbability,
  lateBlightProbability,
  dateIso,
  statusLabel,
  modelLabel,
  legacyModel = false,
}: ResultReportProps) {
  const info = DISEASE_INFO[predictedDisease];
  const isEarly = predictedDisease === 'Early Blight';
  const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="space-y-5" data-testid="result-report">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Image */}
        <Card padded={false} className="overflow-hidden">
          <div className="relative aspect-square w-full bg-subtle lg:aspect-auto lg:h-full lg:min-h-[420px]">
            {imageUrl && !imageFailed ? (
              <img
                src={imageUrl}
                alt="Analyzed potato leaf"
                onError={() => setImageFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : imageLoading ? (
              <Skeleton className="absolute inset-0 rounded-none" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-faint">
                <ImageOff className="h-8 w-8" aria-hidden />
                <p className="text-sm">Image unavailable</p>
              </div>
            )}
            <div className="absolute left-4 top-4">
              <span className="rounded-full bg-forest/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">Analyzed image</span>
            </div>
          </div>
        </Card>

        {/* Prediction */}
        <Card className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">Model prediction</p>
            <Badge tone="late">
              <span className="h-1.5 w-1.5 rounded-full bg-late" aria-hidden />
              {predictedDisease}
            </Badge>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl"
            data-testid="predicted-disease"
          >
            {predictedDisease}
          </motion.h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            <span className="italic">{info.agent}</span> · {info.agentType}
          </p>

          {/* Only the predicted class is shown, always in the green result style. */}
          <div className="mt-6 flex items-end justify-between gap-4 rounded-2xl bg-late-soft p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-late-ink">Prediction confidence</p>
              <p className="tabular mt-1 text-4xl font-extrabold text-ink sm:text-5xl" data-testid="confidence">
                {formatPercent(confidence)}
              </p>
            </div>
            <ShieldCheck className="h-10 w-10 shrink-0 text-late" aria-hidden />
          </div>

          <div className="mt-6">
            <ProbabilityBar label={predictedDisease} value={isEarly ? earlyBlightProbability : lateBlightProbability} tone="late" />
          </div>

          <div className="mt-auto pt-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-sm text-ink-muted">
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-ink-faint" aria-hidden />
                <time dateTime={dateIso}>{formatDateTime(dateIso)}</time>
              </span>
              <span className={cn('flex items-center gap-2', legacyModel && 'text-warning')} data-testid="model-label">
                <Cpu className="h-4 w-4 text-ink-faint" aria-hidden />
                {modelLabel}
              </span>
              {statusLabel && (
                <span className="flex items-center gap-2 font-medium text-accent">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {statusLabel}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {legacyModel && (
        <Notice tone="warning" title="Legacy result">
          This scan was saved with BlightVision’s earlier Teachable Machine model, before the switch to the Random Forest
          classifier. Its probabilities are shown exactly as they were stored, but they are not Random Forest results and
          are not covered by the current Model Evaluation metrics.
        </Notice>
      )}

      {lowConfidence && (
        <Notice tone="warning" title="Lower-confidence prediction">
          The model’s top probability is below {Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%, so the two classes were harder
          to separate for this photo. This does not mean the image is invalid — consider retaking it in even light with one
          leaf filling the frame, and have the plant checked by an expert.
        </Notice>
      )}

      <Notice tone="info" title="Model prediction — not a diagnosis">
        {MODEL_DISCLAIMER} {MODEL_SCOPE_NOTE}
      </Notice>

      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Sprout className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="text-base font-bold text-ink">About {predictedDisease}</h3>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">{info.overview}</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <InfoList title="Common symptoms" icon={<Stethoscope />} items={info.symptoms} />
        <InfoList title="Possible causes" icon={<Bug />} items={info.causes} />
        <InfoList title="General prevention guidance" icon={<CloudSun />} items={info.prevention} />
        <InfoList title="Disease management recommendations" icon={<ListChecks />} items={info.management} />
      </div>
    </div>
  );
}
