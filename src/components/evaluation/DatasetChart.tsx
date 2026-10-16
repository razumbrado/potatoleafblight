import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, ChartFrame, ChartTooltip, GRID_STROKE, SERIES } from '@/components/analytics/ChartParts';
import type { ModelEvaluation } from '@/types';

/** Images per class in the training and testing splits, exactly as recorded by train_model.py. */
export function DatasetChart({ dataset }: { dataset: ModelEvaluation['dataset'] }) {
  const data = [
    {
      label: `Training (${dataset.training_images})`,
      early: dataset.training_distribution['Early Blight'],
      late: dataset.training_distribution['Late Blight'],
    },
    {
      label: `Testing (${dataset.testing_images})`,
      early: dataset.testing_distribution['Early Blight'],
      late: dataset.testing_distribution['Late Blight'],
    },
  ];

  return (
    <ChartFrame height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -6 }} barCategoryGap="30%">
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} tickMargin={10} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--subtle))' }} />
          <Bar
            dataKey={SERIES.early.key}
            name={SERIES.early.label}
            stackId="images"
            fill={SERIES.early.color}
            stroke="rgb(var(--surface))"
            strokeWidth={2}
            maxBarSize={72}
            animationDuration={800}
          />
          <Bar
            dataKey={SERIES.late.key}
            name={SERIES.late.label}
            stackId="images"
            fill={SERIES.late.color}
            stroke="rgb(var(--surface))"
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={72}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
