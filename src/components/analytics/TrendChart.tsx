import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '@/utils/analytics';
import { AXIS_TICK, ChartEmpty, ChartFrame, ChartTooltip, GRID_STROKE, SERIES } from './ChartParts';

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.some((point) => point.total > 0)) {
    return <ChartEmpty message="No classifications in this period yet. Saved scans will plot here." />;
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={28} tickMargin={10} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--line-strong))', strokeWidth: 1 }} />
          {[SERIES.early, SERIES.late].map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              dot={data.length <= 31 ? { r: 2.5, strokeWidth: 0, fill: series.color } : false}
              activeDot={{ r: 5, stroke: 'rgb(var(--surface))', strokeWidth: 2 }}
              animationDuration={900}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
