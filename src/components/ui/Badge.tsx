import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'neutral' | 'accent' | 'early' | 'late' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink-muted',
  accent: 'bg-accent-soft text-accent',
  early: 'bg-early-soft text-early-ink',
  late: 'bg-late-soft text-late-ink',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
