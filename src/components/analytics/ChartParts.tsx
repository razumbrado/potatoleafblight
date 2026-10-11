import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';

/** Series colours — validated for colour-vision-deficiency separation on both themes. */
export const SERIES = {
  early: { key: 'early', label: 'Early Blight', color: 'rgb(var(--early))' },
  late: { key: 'late', label: 'Late Blight', color: 'rgb(var(--late))' },
} as const;

export const AXIS_TICK = { fontSize: 12, fill: 'rgb(var(--ink-faint))' };
export const GRID_STROKE = 'rgb(var(--line))';

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  showTotal?: boolean;
}

export function ChartTooltip({ active, label, payload, showTotal = true }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
  return (
    <div className="min-w-[168px] rounded-xl border border-line bg-surface px-3.5 py-3 shadow-lift">
      {label !== undefined && <p className="mb-2 text-xs font-semibold text-ink-faint">{label}</p>}
      <ul className="space-y-1.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-5 text-sm">
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} aria-hidden />
              {entry.name}
            </span>
            <span className="tabular font-bold text-ink">{entry.value}</span>
          </li>
        ))}
      </ul>
      {showTotal && payload.length > 1 && (
        <p className="mt-2 flex justify-between border-t border-line pt-2 text-sm">
          <span className="text-ink-muted">Total</span>
          <span className="tabular font-bold text-ink">{total}</span>
        </p>
      )}
    </div>
  );
}

export function ChartLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5" aria-label="Chart legend">
      {Object.values(SERIES).map((series) => (
        <li key={series.key} className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: series.color }} aria-hidden />
          {series.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartEmpty({ message, height = 280 }: { message: string; height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ height }}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-ink-faint">
        <BarChart3 className="h-6 w-6" aria-hidden />
      </span>
      <p className="max-w-xs text-sm text-ink-muted">{message}</p>
    </div>
  );
}

export function ChartFrame({ height = 280, children }: { height?: number; children: ReactNode }) {
  return (
    <div className="w-full min-w-0" style={{ height }}>
      {children}
    </div>
  );
}
