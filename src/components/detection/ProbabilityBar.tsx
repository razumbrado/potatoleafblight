import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/format';

interface ProbabilityBarProps {
  label: string;
  /** Model probability, 0–1. */
  value: number;
  tone: 'early' | 'late';
  highlighted?: boolean;
  delay?: number;
}

export function ProbabilityBar({ label, value, tone, highlighted = false, delay = 0 }: ProbabilityBarProps) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className={cn('h-2.5 w-2.5 rounded-full', tone === 'early' ? 'bg-early' : 'bg-late')} aria-hidden />
          {label}
          {highlighted && (
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Top prediction</span>
          )}
        </span>
        <span className="tabular text-sm font-bold text-ink">{formatPercent(value)}</span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-label={`${label} probability`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number((value * 100).toFixed(2))}
      >
        <motion.div
          className={cn('h-full rounded-full print:!w-[var(--bar)]', tone === 'early' ? 'bg-early' : 'bg-late')}
          style={{ ['--bar' as string]: width }}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
