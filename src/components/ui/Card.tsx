import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a gentle lift on hover for clickable or feature cards. */
  interactive?: boolean;
  padded?: boolean;
}

export function Card({ interactive, padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card print-surface',
        padded && 'p-5 sm:p-6',
        interactive && 'transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
