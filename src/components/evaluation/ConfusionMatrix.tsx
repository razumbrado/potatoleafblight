import type { Disease } from '@/types';
import { cn } from '@/utils/cn';

interface ConfusionMatrixProps {
  labels: Disease[];
  /** rows = actual class, columns = predicted class */
  matrix: number[][];
}

/** 2×2 confusion matrix from the held-out test split. Correct predictions sit on the diagonal. */
export function ConfusionMatrix({ labels, matrix }: ConfusionMatrixProps) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
        <div />
        {labels.map((label) => (
          <p key={label} className="px-1 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Predicted
            <span className="block text-xs normal-case tracking-normal text-ink">{label}</span>
          </p>
        ))}

        {labels.map((actual, row) => {
          const rowTotal = matrix[row].reduce((sum, value) => sum + value, 0);
          return [
            <p key={`${actual}-label`} className="flex items-center pr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <span>
                Actual
                <span className="block text-xs normal-case tracking-normal text-ink">{actual}</span>
              </span>
            </p>,
            ...labels.map((predicted, col) => {
              const value = matrix[row][col];
              const correct = row === col;
              const share = rowTotal === 0 ? 0 : (value / rowTotal) * 100;
              return (
                <div
                  key={`${actual}-${predicted}`}
                  className={cn(
                    'flex min-h-[112px] flex-col items-center justify-center rounded-2xl border p-3 text-center',
                    correct ? 'border-transparent bg-accent-soft' : value > 0 ? 'border-transparent bg-danger-soft' : 'border-line bg-surface-alt',
                  )}
                  aria-label={`Actual ${actual}, predicted ${predicted}: ${value} images`}
                  data-testid={`cm-${row}-${col}`}
                >
                  <span className={cn('tabular text-3xl font-extrabold sm:text-4xl', correct ? 'text-accent' : value > 0 ? 'text-danger' : 'text-ink-faint')}>
                    {value}
                  </span>
                  <span className="mt-1 text-xs text-ink-muted">{share.toFixed(1)}% of actual</span>
                  <span className={cn('mt-1.5 text-[11px] font-semibold', correct ? 'text-accent' : 'text-ink-faint')}>
                    {correct ? 'Correct' : 'Misclassified'}
                  </span>
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}
