import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  BarChart3,
  BrainCircuit,
  Crosshair,
  Grid2x2,
  Layers,
  RefreshCw,
  Scale,
  ServerCrash,
  Sigma,
  Table2,
  Target,
  Terminal,
  TreePine,
} from 'lucide-react';
import { Notice } from '@/components/common/Notice';
import { PageHeader } from '@/components/common/PageHeader';
import { ChartLegend } from '@/components/analytics/ChartParts';
import { ConfusionMatrix } from '@/components/evaluation/ConfusionMatrix';
import { DatasetChart } from '@/components/evaluation/DatasetChart';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError, api } from '@/services/api';
import type { ClassMetrics, ModelEvaluation, ModelInfo } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatPercent, getErrorMessage } from '@/utils/format';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; evaluation: ModelEvaluation; info: ModelInfo }
  | { kind: 'untrained'; message: string }
  | { kind: 'error'; message: string };

const SOURCE_LABELS: Record<string, string> = {
  main_dataset: 'Main dataset',
  PlantVillage: 'Main dataset (single leaf, plain background)',
  field_tanzania: 'Field photos (Tanzania smallholder farms)',
};
const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source.replace(/_/g, ' ');

function MetricCard({ label, value, caption, icon }: { label: string; value: number; caption: string; icon: ReactNode }) {
  return (
    <Card interactive className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-pine-800/70 dark:text-ink-muted">{label}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-pine-100 text-pine-700 dark:bg-subtle dark:text-pine-300 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <p className="tabular mt-2 text-3xl font-extrabold tracking-[-0.02em] text-pine-900 sm:text-4xl dark:text-ink" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {formatPercent(value)}
      </p>
      <p className="mt-1.5 text-xs text-ink-faint">{caption}</p>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ReportRow({ name, metrics, emphasis }: { name: string; metrics: ClassMetrics; emphasis?: boolean }) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-alt', emphasis && 'font-semibold')}>
      <th scope="row" className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-ink sm:px-6">
        {name}
      </th>
      <td className="tabular px-4 py-3 text-sm text-ink">{formatPercent(metrics.precision)}</td>
      <td className="tabular px-4 py-3 text-sm text-ink">{formatPercent(metrics.recall)}</td>
      <td className="tabular px-4 py-3 text-sm text-ink">{formatPercent(metrics.f1_score)}</td>
      <td className="tabular px-4 py-3 pr-4 text-right text-sm text-ink sm:pr-6">{metrics.support.toLocaleString()}</td>
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading model evaluation">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
    </div>
  );
}

export function ModelEvaluationPage() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const [evaluation, info] = await Promise.all([api.evaluation(), api.modelInfo()]);
      setState({ kind: 'ready', evaluation, info });
    } catch (cause) {
      const message = getErrorMessage(cause, 'The model evaluation could not be loaded.');
      setState(cause instanceof ApiError && cause.modelNotTrained ? { kind: 'untrained', message } : { kind: 'error', message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshButton = (
    <Button variant="outline" onClick={() => void load()} disabled={state.kind === 'loading'} icon={<RefreshCw className={cn('h-4 w-4', state.kind === 'loading' && 'animate-spin')} />}>
      Refresh
    </Button>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Random Forest"
        title="Model Evaluation"
        description="How the trained classifier performed on images it never saw during training. Every value is loaded live from the Python backend."
        actions={refreshButton}
      />

      {state.kind === 'loading' && <LoadingSkeleton />}

      {state.kind === 'error' && (
        <Card padded={false}>
          <EmptyState
            icon={
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <ServerCrash className="h-8 w-8" aria-hidden />
              </span>
            }
            title="Model server unavailable"
            description={state.message}
            action={
              <Button onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>
                Try again
              </Button>
            }
          />
        </Card>
      )}

      {state.kind === 'untrained' && (
        <Card padded={false}>
          <EmptyState
            title="The model has not been trained yet"
            description="Evaluation results appear here after the Random Forest is trained on your dataset. Nothing is shown until real results exist."
            action={
              <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-alt p-4 text-left">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Terminal className="h-4 w-4 text-accent" aria-hidden />
                  Train the model
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-muted">
                  <li>
                    Put images in <code className="font-mono text-xs text-ink">backend/dataset/Early_Blight/</code> and{' '}
                    <code className="font-mono text-xs text-ink">backend/dataset/Late_Blight/</code>
                  </li>
                  <li>
                    Run <code className="font-mono text-xs text-ink">python train_model.py</code> inside <code className="font-mono text-xs text-ink">backend/</code>
                  </li>
                  <li>Click Refresh</li>
                </ol>
              </div>
            }
          />
        </Card>
      )}

      {state.kind === 'ready' && <EvaluationContent evaluation={state.evaluation} info={state.info} />}
    </div>
  );
}

function EvaluationContent({ evaluation, info }: { evaluation: ModelEvaluation; info: ModelInfo }) {
  const { dataset, classification_report: report, confusion_matrix: cm, positive_class: positive } = evaluation;
  const testCaption = `On ${dataset.testing_images.toLocaleString()} held-out test images`;
  const overfitGap = evaluation.training_accuracy - evaluation.testing_accuracy;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Training Accuracy" value={evaluation.training_accuracy} caption={`On ${dataset.training_images.toLocaleString()} training images`} icon={<BrainCircuit />} />
        <MetricCard label="Testing Accuracy" value={evaluation.testing_accuracy} caption={testCaption} icon={<Target />} />
        <MetricCard label="Precision" value={evaluation.precision} caption={`Positive class: ${positive}`} icon={<Crosshair />} />
        <MetricCard label="Recall" value={evaluation.recall} caption={`Positive class: ${positive}`} icon={<Scale />} />
        <MetricCard label="F1-Score" value={evaluation.f1_score} caption={`Positive class: ${positive}`} icon={<Sigma />} />
      </div>

      <Notice tone="info" title="Reading these numbers">
        Precision, recall, and F1 treat <strong>{positive}</strong> as the positive class; per-class values are in
        the classification report below. Random Forests usually fit their own training images almost perfectly, so the
        {overfitGap > 0 ? ` ${formatPercent(overfitGap)} gap between training and testing accuracy` : ' training accuracy'} is
        expected. These are results on this dataset, not a guarantee for any individual image.
      </Notice>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="min-w-0">
          <CardHeader title="Confusion Matrix" description={`${testCaption} · rows = actual, columns = predicted`} icon={<Grid2x2 />} />
          <ConfusionMatrix labels={cm.labels} matrix={cm.matrix} />
        </Card>

        <Card padded={false} className="flex min-w-0 flex-col overflow-hidden">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title="Classification Report" description={`scikit-learn classification_report · ${testCaption.toLowerCase()}`} icon={<Table2 />} />
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="h-full w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-y border-line bg-surface-alt text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <th scope="col" className="px-4 py-3 sm:px-6">Disease class</th>
                  <th scope="col" className="px-4 py-3">Precision</th>
                  <th scope="col" className="px-4 py-3">Recall</th>
                  <th scope="col" className="px-4 py-3">F1-Score</th>
                  <th scope="col" className="px-4 py-3 pr-4 text-right sm:pr-6">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {evaluation.classes.map((name) => (
                  <ReportRow key={name} name={name} metrics={report.per_class[name]} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {evaluation.by_source && Object.keys(evaluation.by_source).length > 1 && (
        <Card className="min-w-0">
          <CardHeader
            title="Test Accuracy by Image Source"
            description="The same held-out test split, broken down by where the photos came from"
            icon={<Layers />}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(evaluation.by_source).map(([source, stats]) => {
              const [[ee, el], [le, ll]] = stats.confusion_matrix;
              return (
                <div key={source} className="rounded-2xl border border-line bg-surface-alt p-4" data-testid={`source-${source}`}>
                  <p className="text-sm font-bold text-ink">{sourceLabel(source)}</p>
                  <p className="text-xs text-ink-faint">{stats.images.toLocaleString()} test images</p>
                  <p className="tabular mt-2 text-3xl font-extrabold text-ink">{formatPercent(stats.accuracy)}</p>
                  <p className="text-xs text-ink-muted">accuracy · macro F1 {formatPercent(stats.macro_f1_score)}</p>
                  <p className="mt-2 text-xs text-ink-faint">
                    Early Blight: {ee} correct, {el} called Late · Late Blight: {ll} correct, {le} called Early
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card className="min-w-0">
          <CardHeader
            title="Dataset Distribution"
            description={`${dataset.total_images.toLocaleString()} images · stratified ${Math.round(info.train_test_split.train * 100)} / ${Math.round(info.train_test_split.test * 100)} split`}
            icon={<BarChart3 />}
            action={<ChartLegend />}
          />
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Early Blight images', value: dataset.class_distribution['Early Blight'], tone: 'bg-early-soft text-early-ink' },
              { label: 'Late Blight images', value: dataset.class_distribution['Late Blight'], tone: 'bg-late-soft text-late-ink' },
              { label: 'Training images', value: dataset.training_images, tone: 'bg-subtle text-ink' },
              { label: 'Testing images', value: dataset.testing_images, tone: 'bg-subtle text-ink' },
            ].map((tile) => (
              <div key={tile.label} className={cn('rounded-xl p-3.5', tile.tone)}>
                <p className="text-xs font-semibold opacity-80">{tile.label}</p>
                <p className="tabular mt-1 text-2xl font-extrabold">{tile.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <DatasetChart dataset={dataset} />
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            {dataset.duplicate_groups > 0
              ? `${dataset.images_in_duplicate_groups} near-duplicate or augmented images were found in ${dataset.duplicate_groups} groups and kept on the same side of the split.`
              : 'No near-duplicate or augmented copies were found, so every image was split independently.'}
            {dataset.rejected_files > 0 && ` ${dataset.rejected_files} unreadable file(s) were skipped.`}
            {dataset.augmented_training_rows
              ? ` Training also used ${dataset.augmented_training_rows.toLocaleString()} augmented copies of the training images (zoom, lighting, background); test images were never augmented for the metrics above.`
              : ''}
          </p>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Model Information" description="From backend/models/model_info.json" icon={<TreePine />} />
          <dl className="divide-y divide-line">
            <InfoRow label="Algorithm" value={info.algorithm} />
            <InfoRow label="Implementation" value={info.implementation} />
            <InfoRow label="Model version" value={<span className="font-mono text-xs">{info.model_version}</span>} />
            <InfoRow label="Training date" value={formatDateTime(info.training_date)} />
            <InfoRow label="Dataset size" value={`${info.dataset_size.toLocaleString()} images`} />
            <InfoRow
              label="Train / test ratio"
              value={`${(info.train_test_split.actual_train_ratio * 100).toFixed(0)}% / ${(info.train_test_split.actual_test_ratio * 100).toFixed(0)}% (random_state=${info.train_test_split.random_state})`}
            />
            <InfoRow label="Decision trees" value={info.n_estimators.toLocaleString()} />
            <InfoRow label="Probability calibration" value={info.probability_calibration ? info.probability_calibration.method : 'None (raw tree votes)'} />
            <InfoRow label="Features per image" value={info.feature_count.toLocaleString()} />
            <InfoRow label="Classes" value={info.classes.join(' · ')} />
          </dl>
        </Card>
      </div>
    </div>
  );
}
