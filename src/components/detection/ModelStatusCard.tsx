import { AlertTriangle, CheckCircle2, Cpu, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useModel } from '@/contexts/ModelContext';
import { cn } from '@/utils/cn';

/** Compact, live status of the Teachable Machine model. */
export function ModelStatusCard({ className }: { className?: string }) {
  const { status, info, error, reload } = useModel();

  const content = {
    idle: { icon: <Cpu className="h-5 w-5" />, title: 'Model standing by', text: 'The model loads when the workspace opens.', tone: 'bg-subtle text-ink-muted' },
    loading: { icon: <Loader2 className="h-5 w-5 animate-spin" />, title: 'Loading AI model…', text: 'Downloading the trained weights. Analysis unlocks when this finishes.', tone: 'bg-warning-soft text-warning' },
    ready: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: 'AI model ready',
      text: info
        ? `${info.labels.length} classes · ${info.imageSize}×${info.imageSize} input · ${info.backend ?? 'tfjs'} backend`
        : 'Ready to analyze.',
      tone: 'bg-accent-soft text-accent',
    },
    error: { icon: <AlertTriangle className="h-5 w-5" />, title: 'Model failed to load', text: error ?? 'Unknown error.', tone: 'bg-danger-soft text-danger' },
  }[status];

  return (
    <div className={cn('card flex items-start gap-3.5 p-4', className)} role="status" aria-live="polite" data-model-status={status}>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', content.tone)}>{content.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{content.title}</p>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-ink-muted">{content.text}</p>
        {status === 'error' && (
          <Button size="sm" variant="outline" className="mt-3" onClick={reload} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Retry loading
          </Button>
        )}
      </div>
    </div>
  );
}
