import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** Decorative leaf-and-magnifier illustration used by empty states. */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={cn('h-36 w-auto', className)} role="img" aria-hidden>
      <ellipse cx="100" cy="132" rx="62" ry="8" className="fill-subtle" />
      <rect x="46" y="26" width="92" height="96" rx="14" className="fill-surface stroke-line-strong" strokeWidth="2" />
      <rect x="58" y="40" width="40" height="6" rx="3" className="fill-line-strong" />
      <rect x="58" y="54" width="68" height="5" rx="2.5" className="fill-line" />
      <rect x="58" y="66" width="56" height="5" rx="2.5" className="fill-line" />
      <path
        d="M66 108c0-16 10-26 26-26 0 16-10 26-26 26z"
        className="fill-accent-soft stroke-accent"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M68 106l15-15" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
      <circle cx="136" cy="88" r="22" className="fill-surface stroke-accent" strokeWidth="4" />
      <path d="M152 105l16 17" className="stroke-accent" strokeWidth="6" strokeLinecap="round" />
      <circle cx="130" cy="84" r="3" className="fill-accent/40" />
      <circle cx="141" cy="93" r="2" className="fill-accent/40" />
      <circle cx="162" cy="34" r="4" className="fill-accent/30" />
      <circle cx="30" cy="62" r="3" className="fill-accent/30" />
      <circle cx="174" cy="60" r="2" className="fill-accent/40" />
    </svg>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon ?? <EmptyIllustration />}
      <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
