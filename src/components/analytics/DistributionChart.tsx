import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Summary } from '@/utils/analytics';
import { ChartEmpty, ChartTooltip, SERIES } from './ChartParts';

export function DistributionChart({ summary }: { summary: Summary }) {
  if (summary.total === 0) return <ChartEmpty message="No scans in this period yet." height={260} />;

  const data = [
    { ...SERIES.early, value: summary.early },
    { ...SERIES.late, value: summary.late },
  ];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-[220px] w-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.filter((slice) => slice.value > 0)}
              dataKey="value"
              nameKey="label"
              innerRadius={72}
              outerRadius={104}
              startAngle={90}
              endAngle={-270}
              paddingAngle={summary.early > 0 && summary.late > 0 ? 2 : 0}
              cornerRadius={4}
              stroke="rgb(var(--surface))"
              strokeWidth={2}
              animationDuration={900}
            >
              {data
                .filter((slice) => slice.value > 0)
                .map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
            </Pie>
            <Tooltip content={<ChartTooltip showTotal={false} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-3xl font-extrabold text-ink">{summary.total.toLocaleString()}</span>
          <span className="text-xs font-medium text-ink-faint">{summary.total === 1 ? 'scan' : 'scans'}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-3">
        {data.map((slice) => {
          const share = summary.total === 0 ? 0 : (slice.value / summary.total) * 100;
          return (
            <li key={slice.key} className="rounded-xl border border-line bg-surface-alt p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} aria-hidden />
                  {slice.label}
                </span>
                <span className="tabular text-sm font-bold text-ink">{share.toFixed(1)}%</span>
              </div>
              <p className="mt-1 pl-[18px] text-xs text-ink-faint">
                {slice.value.toLocaleString()} {slice.value === 1 ? 'prediction' : 'predictions'}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
