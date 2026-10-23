import type { ReactNode } from 'react';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  icon: ReactNode;
  /** Numeric values animate; text values (e.g. a disease name) render as-is. */
  value: number | string;
  caption?: string;
  tone?: 'accent' | 'early' | 'late';
  loading?: boolean;
}

const tones = {
  accent: 'bg-pine-100 text-pine-700 dark:bg-subtle dark:text-pine-300',
  early: 'bg-early-soft text-early-ink',
  late: 'bg-late-soft text-late-ink',
};

export function StatCard({ label, icon, value, caption, tone = 'accent', loading }: StatCardProps) {
  return (
    <Card interactive className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-pine-800/70 dark:text-ink-muted">{label}</p>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] [&>svg]:h-5 [&>svg]:w-5', tones[tone])}>{icon}</span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-9 w-24" />
          <Skeleton className="mt-3 h-3.5 w-32" />
        </>
      ) : (
        <>
          <p className={cn('mt-2 font-extrabold tracking-[-0.02em] text-pine-900 dark:text-ink', typeof value === 'number' ? 'text-4xl' : 'text-2xl leading-10')}>
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {caption && <p className="mt-1.5 text-xs text-ink-faint">{caption}</p>}
        </>
      )}
    </Card>
  );
}
