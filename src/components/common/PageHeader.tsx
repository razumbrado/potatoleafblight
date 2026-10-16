import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Extra classes for the actions container, e.g. a full-width button row on phones. */
  actionsClassName?: string;
}

export function PageHeader({ eyebrow, title, description, actions, actionsClassName }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className={cn('no-print flex flex-wrap items-center gap-2.5', actionsClassName)}>{actions}</div>}
    </div>
  );
}
