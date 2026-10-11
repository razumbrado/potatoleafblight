import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '@/utils/analytics';
import { AXIS_TICK, ChartEmpty, ChartFrame, ChartTooltip, GRID_STROKE, SERIES } from './ChartParts';

export function MonthlyChart({ data }: { data: TrendPoint[] }) {
  if (!data.some((point) => point.total > 0)) {
    return <ChartEmpty message="No detections recorded in the last 12 months." />;
  }

  return (
    <ChartFrame height={340}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={12} tickMargin={10} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--subtle))' }} />
          <Bar
            dataKey={SERIES.early.key}
            name={SERIES.early.label}
            stackId="detections"
            fill={SERIES.early.color}
            stroke="rgb(var(--surface))"
            strokeWidth={2}
            maxBarSize={36}
            animationDuration={800}
          />
          <Bar
            dataKey={SERIES.late.key}
            name={SERIES.late.label}
            stackId="detections"
            fill={SERIES.late.color}
            stroke="rgb(var(--surface))"
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
