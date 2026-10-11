import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CalendarRange, Layers, PieChart as PieIcon, RefreshCw, ScanLine, Sprout, TrendingUp, Trophy } from 'lucide-react';
import { Notice } from '@/components/common/Notice';
import { PageHeader } from '@/components/common/PageHeader';
import { ChartLegend } from '@/components/analytics/ChartParts';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { MonthlyChart } from '@/components/analytics/MonthlyChart';
import { RecentActivity } from '@/components/analytics/RecentActivity';
import { StatCard } from '@/components/analytics/StatCard';
import { TrendChart } from '@/components/analytics/TrendChart';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useScans } from '@/contexts/ScansContext';
import { cn } from '@/utils/cn';
import { filterByRange, monthlySeries, RANGE_OPTIONS, summarise, trendSeries, type RangeKey } from '@/utils/analytics';
import { formatPercent } from '@/utils/format';

export function AnalyticsPage() {
  const { scans, loading, error, refresh } = useScans();
  const [range, setRange] = useState<RangeKey>('30d');

  const inRange = useMemo(() => filterByRange(scans, range), [scans, range]);
  const summary = useMemo(() => summarise(inRange), [inRange]);
  const trend = useMemo(() => trendSeries(inRange, range), [inRange, range]);
  const monthly = useMemo(() => monthlySeries(scans), [scans]);
  const recent = useMemo(() => inRange.slice(0, 6), [inRange]);

  const rangeDescription = RANGE_OPTIONS.find((option) => option.key === range)?.description ?? '';
  const initialLoading = loading && scans.length === 0;
  const share = (count: number) => (summary.total === 0 ? 'No scans in this period' : `${((count / summary.total) * 100).toFixed(1)}% of scans`);

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Analytics Dashboard"
        description="Calculated live from the scans saved in your Supabase history."
        actions={
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1" role="group" aria-label="Date range">
            <CalendarRange className="ml-2 mr-1 hidden h-4 w-4 shrink-0 text-ink-faint sm:block" aria-hidden />
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                aria-pressed={range === option.key}
                className={cn(
                  'h-9 shrink-0 rounded-lg px-3 text-sm font-semibold transition-colors',
                  range === option.key ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:bg-subtle hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <Notice
          tone="danger"
          title="Could not load your scans"
          className="mb-5"
          action={
            <Button size="sm" variant="outline" onClick={() => void refresh()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
              Try again
            </Button>
          }
        >
          {error}
        </Notice>
      )}

      {!initialLoading && !error && scans.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            title="No analytics yet"
            description="Charts and totals are built only from scans you have saved. Analyze a leaf and save the result to start your dashboard."
            action={
              <Link to="/detect" className={buttonStyles()}>
                <ScanLine className="h-4 w-4" aria-hidden />
                Start Detection
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Scans"
              icon={<Layers />}
              value={summary.total}
              caption={
                summary.averageConfidence === null
                  ? rangeDescription
                  : `${rangeDescription} · avg. confidence ${formatPercent(summary.averageConfidence)}`
              }
              loading={initialLoading}
            />
            <StatCard label="Early Blight Predictions" icon={<Sprout />} value={summary.early} caption={share(summary.early)} tone="early" loading={initialLoading} />
            <StatCard label="Late Blight Predictions" icon={<Activity />} value={summary.late} caption={share(summary.late)} tone="late" loading={initialLoading} />
            <StatCard
              label="Most Frequent Disease"
              icon={<Trophy />}
              value={summary.mostFrequent ?? (summary.tied ? 'Tied' : '—')}
              caption={
                summary.mostFrequent
                  ? `${Math.max(summary.early, summary.late)} of ${summary.total} predictions`
                  : summary.tied
                    ? 'Both classes predicted equally often'
                    : 'No scans in this period'
              }
              tone={summary.mostFrequent === 'Early Blight' ? 'early' : summary.mostFrequent === 'Late Blight' ? 'late' : 'accent'}
              loading={initialLoading}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Card>
              <CardHeader title="Disease Distribution" description={rangeDescription} icon={<PieIcon />} />
              {initialLoading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : <DistributionChart summary={summary} />}
            </Card>
            <Card className="min-w-0">
              <CardHeader
                title="Classification Trends"
                description={`${rangeDescription} · ${range === '12m' || range === 'all' ? 'predictions per month' : 'predictions per day'}`}
                icon={<TrendingUp />}
                action={<ChartLegend />}
              />
              {initialLoading ? <Skeleton className="h-[280px] w-full rounded-xl" /> : <TrendChart data={trend} />}
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <Card className="min-w-0">
              <CardHeader
                title="Monthly Detection"
                description="Last 12 months · not affected by the date range"
                icon={<CalendarRange />}
                action={<ChartLegend />}
              />
              {initialLoading ? <Skeleton className="h-[340px] w-full rounded-xl" /> : <MonthlyChart data={monthly} />}
            </Card>
            <Card>
              <CardHeader
                title="Recent Scan Activity"
                description={rangeDescription}
                icon={<Activity />}
                action={
                  <Link to="/history" className="text-sm font-semibold text-accent hover:underline">
                    View all
                  </Link>
                }
              />
              {initialLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <RecentActivity scans={recent} />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
