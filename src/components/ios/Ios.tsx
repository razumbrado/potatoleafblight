import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Small white pill used in the page hero to show a fact, e.g. "Random Forest". */
export function HeroChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-pine-800 shadow-[0_1px_2px_rgb(11_43_38/0.06)] ring-1 ring-pine-300/40 dark:bg-subtle dark:text-ink dark:ring-line [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-pine-700 dark:[&>svg]:text-pine-300">
      {icon}
      {children}
    </span>
  );
}

/** Page title: same layout as the other page headers, with a two-tone, tightly set heading. */
export function IosLargeTitle({
  title,
  highlight,
  subtitle,
  actions,
}: {
  title: string;
  /** Last words of the title shown in medium green, e.g. "Detection". */
  highlight?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-xl font-extrabold leading-tight tracking-[-0.02em] text-pine-900 sm:text-2xl dark:text-ink">
          {title}
          {highlight && <span className="text-pine-700 dark:text-pine-300"> {highlight}</span>}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm font-medium leading-relaxed text-pine-800/70 dark:text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A white card with a bold title row and an optional "See all" style action. */
export function IosSection({
  header,
  action,
  footer,
  children,
  className,
  bodyClassName,
}: {
  header?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('min-w-0', className)}>
      {(header || action) && (
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          {header && <h2 className="text-[15px] font-bold text-pine-900 dark:text-ink">{header}</h2>}
          {action && <div className="text-[13px] font-semibold text-pine-700 dark:text-pine-300">{action}</div>}
        </div>
      )}
      <div
        className={cn(
          'card overflow-hidden',
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer && <div className="mt-2.5 px-2 text-[13px] leading-relaxed text-ink-faint">{footer}</div>}
    </section>
  );
}

/** One row of a list inside an IosSection, with an inset separator and a round chevron chip. */
export function IosRow({
  to,
  leading,
  title,
  subtitle,
  detail,
  accent = false,
  insetClassName = 'after:left-4',
}: {
  to: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: ReactNode;
  /** Tinted title, like an action row. */
  accent?: boolean;
  /** Where the separator line starts, so it lines up with the text instead of the image. */
  insetClassName?: string;
}) {
  return (
    <li
      className={cn(
        'relative after:absolute after:bottom-0 after:right-4 after:h-px after:bg-pine-100 last:after:hidden dark:after:bg-line',
        insetClassName,
      )}
    >
      <Link to={to} className="group flex min-h-[48px] items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-pine-100/40 dark:hover:bg-subtle">
        {leading}
        <div className="min-w-0 flex-1">
          <p className={cn('text-[15px] font-bold', accent ? 'text-pine-700 dark:text-pine-300' : 'text-pine-900 dark:text-ink')}>{title}</p>
          {subtitle && <div className="mt-0.5 text-[13px] leading-snug text-ink-muted">{subtitle}</div>}
        </div>
        {detail && <span className="shrink-0 text-[13px] text-ink-faint">{detail}</span>}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-100 text-pine-700 transition-colors group-hover:bg-pine-300/60 dark:bg-subtle dark:text-pine-300">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

/** Solid medium-green pill used for the main action on a page. */
export const pillPrimary = 'rounded-full bg-pine-700 text-white shadow-sm hover:bg-pine-800 hover:shadow-md';

/** White pill with a soft border, for secondary actions. */
export const pillSecondary =
  'rounded-full border border-pine-100 bg-white text-pine-800 shadow-sm hover:border-pine-300 hover:bg-pine-100/40 dark:border-line dark:bg-surface dark:text-ink';
