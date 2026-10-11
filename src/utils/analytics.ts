import type { Disease, ScanRecord } from '@/types';
import { toLocalDateKey } from './format';

export type RangeKey = '7d' | '30d' | '90d' | '12m' | 'all';

export const RANGE_OPTIONS: { key: RangeKey; label: string; description: string }[] = [
  { key: '7d', label: '7 days', description: 'Last 7 days' },
  { key: '30d', label: '30 days', description: 'Last 30 days' },
  { key: '90d', label: '90 days', description: 'Last 90 days' },
  { key: '12m', label: '12 months', description: 'Last 12 months' },
  { key: 'all', label: 'All time', description: 'All time' },
];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** First instant included in the range, or null for "all time". */
export function rangeStart(range: RangeKey, now = new Date()): Date | null {
  const today = startOfDay(now);
  switch (range) {
    case '7d':
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    case '30d':
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    case '90d':
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89);
    case '12m':
      return new Date(today.getFullYear(), today.getMonth() - 11, 1);
    default:
      return null;
  }
}

export function filterByRange(scans: ScanRecord[], range: RangeKey, now = new Date()): ScanRecord[] {
  const start = rangeStart(range, now);
  if (!start) return scans;
  const startMs = start.getTime();
  return scans.filter((scan) => new Date(scan.scanned_at).getTime() >= startMs);
}

export interface Summary {
  total: number;
  early: number;
  late: number;
  /** null when there are no scans or the two classes are tied. */
  mostFrequent: Disease | null;
  tied: boolean;
  averageConfidence: number | null;
}

export function summarise(scans: ScanRecord[]): Summary {
  let early = 0;
  let late = 0;
  let confidenceSum = 0;
  for (const scan of scans) {
    if (scan.predicted_disease === 'Early Blight') early += 1;
    else if (scan.predicted_disease === 'Late Blight') late += 1;
    confidenceSum += scan.confidence;
  }
  const total = scans.length;
  const tied = total > 0 && early === late;
  return {
    total,
    early,
    late,
    mostFrequent: total === 0 || tied ? null : early > late ? 'Early Blight' : 'Late Blight',
    tied,
    averageConfidence: total === 0 ? null : confidenceSum / total,
  };
}

export interface TrendPoint {
  key: string;
  label: string;
  early: number;
  late: number;
  total: number;
}

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
const dayLabel = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function bucket(scans: ScanRecord[], points: TrendPoint[], keyOf: (date: Date) => string): TrendPoint[] {
  const index = new Map(points.map((point) => [point.key, point]));
  for (const scan of scans) {
    const point = index.get(keyOf(new Date(scan.scanned_at)));
    if (!point) continue;
    if (scan.predicted_disease === 'Early Blight') point.early += 1;
    else if (scan.predicted_disease === 'Late Blight') point.late += 1;
    point.total += 1;
  }
  return points;
}

function monthPoints(from: Date, to: Date): TrendPoint[] {
  const points: TrendPoint[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor <= end) {
    points.push({ key: monthKey(cursor), label: monthLabel(cursor), early: 0, late: 0, total: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

/** Monthly counts for the 12 calendar months ending with the current month. */
export function monthlySeries(scans: ScanRecord[], now = new Date()): TrendPoint[] {
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return bucket(scans, monthPoints(from, now), monthKey);
}

/**
 * Classification counts over time for the selected range.
 * Daily buckets for the day-based ranges; monthly buckets for 12 months / all time.
 */
export function trendSeries(scans: ScanRecord[], range: RangeKey, now = new Date()): TrendPoint[] {
  if (range === '12m' || range === 'all') {
    let from = rangeStart('12m', now)!;
    if (range === 'all' && scans.length > 0) {
      const earliest = scans.reduce(
        (min, scan) => Math.min(min, new Date(scan.scanned_at).getTime()),
        Number.POSITIVE_INFINITY,
      );
      // Show at least six months so a brand-new history still reads as a trend.
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      from = new Date(Math.min(earliest, sixMonthsAgo.getTime()));
    }
    return bucket(scans, monthPoints(from, now), monthKey);
  }

  const start = rangeStart(range, now)!;
  const points: TrendPoint[] = [];
  const cursor = new Date(start);
  const end = startOfDay(now);
  while (cursor <= end) {
    points.push({ key: toLocalDateKey(cursor), label: dayLabel(cursor), early: 0, late: 0, total: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return bucket(scans, points, toLocalDateKey);
}
