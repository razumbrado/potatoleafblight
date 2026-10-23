import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  /** Kept for API compatibility; the header no longer shows a small label above the title. */
  eyebrow?: string;
  title: string;
  /** End of the title shown in medium green. Defaults to the last word of multi-word titles. */
  highlight?: string;
  description?: string;
  actions?: ReactNode;
  /** Extra classes for the actions container, e.g. a full-width button row on phones. */
  actionsClassName?: string;
}

function splitTitle(title: string, highlight?: string): [string, string] {
  if (highlight && title.endsWith(highlight)) return [title.slice(0, -highlight.length).trimEnd(), highlight];
  const index = title.lastIndexOf(' ');
  return index > 0 ? [title.slice(0, index), title.slice(index + 1)] : [title, ''];
}

/** Page title in the content-page style: two-tone heading with a short subtitle. */
export function PageHeader({ title, highlight, description, actions, actionsClassName }: PageHeaderProps) {
  const [lead, accent] = splitTitle(title, highlight);
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-xl font-extrabold leading-tight tracking-[-0.02em] text-pine-900 sm:text-2xl dark:text-ink">
          {lead}
          {accent && <span className="text-pine-700 dark:text-pine-300"> {accent}</span>}
        </h1>
        {description && <p className="mt-1.5 text-sm font-medium leading-relaxed text-pine-800/70 dark:text-ink-muted">{description}</p>}
      </div>
      {actions && <div className={cn('no-print flex flex-wrap items-center gap-2.5', actionsClassName)}>{actions}</div>}
    </div>
  );
}
