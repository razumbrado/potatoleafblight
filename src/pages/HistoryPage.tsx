import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Eye, FilterX, RefreshCw, ScanLine, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DiseaseBadge } from '@/components/common/DiseaseBadge';
import { Notice } from '@/components/common/Notice';
import { PageHeader } from '@/components/common/PageHeader';
import { ScanThumb } from '@/components/common/ScanThumb';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useScans } from '@/contexts/ScansContext';
import { useSignedUrls } from '@/hooks/useSignedUrls';
import { DISEASES, type ScanRecord } from '@/types';
import { exportScansCsv } from '@/utils/csv';
import { formatDate, formatDateTime, formatPercent, formatTime, getErrorMessage } from '@/utils/format';

type SortKey = 'newest' | 'oldest' | 'confidence-desc' | 'confidence-asc' | 'disease';

const SORTERS: Record<SortKey, (a: ScanRecord, b: ScanRecord) => number> = {
  newest: (a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime(),
  oldest: (a, b) => new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime(),
  'confidence-desc': (a, b) => b.confidence - a.confidence,
  'confidence-asc': (a, b) => a.confidence - b.confidence,
  disease: (a, b) =>
    a.predicted_disease.localeCompare(b.predicted_disease) || new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime(),
};

const PAGE_SIZES = [10, 25, 50];

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-subtle lg:block" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="tabular text-sm font-semibold text-ink">{formatPercent(value)}</span>
    </div>
  );
}

export function HistoryPage() {
  const { scans, loading, error, refresh, remove, clearAll } = useScans();

  const [query, setQuery] = useState('');
  const [disease, setDisease] = useState<'all' | (typeof DISEASES)[number]>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);

  const [pendingDelete, setPendingDelete] = useState<ScanRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const dateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return scans
      .filter((scan) => {
        if (disease !== 'all' && scan.predicted_disease !== disease) return false;
        const time = new Date(scan.scanned_at).getTime();
        if (fromMs !== null && time < fromMs) return false;
        if (toMs !== null && time > toMs) return false;
        if (!needle) return true;
        const haystack = [scan.predicted_disease, formatDateTime(scan.scanned_at), formatPercent(scan.confidence), scan.id]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort(SORTERS[sort]);
  }, [scans, query, disease, fromDate, toDate, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  // Any filter change returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [query, disease, fromDate, toDate, sort, pageSize]);

  const { urls, loading: urlsLoading } = useSignedUrls(pageRows.map((scan) => scan.image_path));

  const hasFilters = Boolean(query || disease !== 'all' || fromDate || toDate);
  const clearFilters = () => {
    setQuery('');
    setDisease('all');
    setFromDate('');
    setToDate('');
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await remove(pendingDelete);
      toast.success('Scan deleted.');
      setPendingDelete(null);
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'The scan could not be deleted.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const count = await clearAll();
      toast.success(count === 1 ? '1 scan removed from your history.' : `${count} scans removed from your history.`);
      setConfirmClear(false);
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Your history could not be cleared.'));
    } finally {
      setClearing(false);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('There are no scans to export.');
      return;
    }
    exportScansCsv(filtered);
    toast.success(`Exported ${filtered.length} ${filtered.length === 1 ? 'scan' : 'scans'} to CSV.`);
  };

  const showSkeleton = loading && scans.length === 0;
  const firstRow = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, filtered.length);

  return (
    <div>
      <PageHeader
        eyebrow="Your records"
        title="Scan History"
        description="Every classification you have saved, stored privately in your Supabase account."
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} icon={<Download className="h-4 w-4" />}>
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="text-danger hover:border-danger hover:bg-danger-soft"
              onClick={() => setConfirmClear(true)}
              disabled={scans.length === 0}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Clear History
            </Button>
          </>
        }
      />

      {error && (
        <Notice
          tone="danger"
          title="Could not load your scan history"
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

      {/* Filters */}
      <Card className="mb-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
          <Input
            label="Search"
            type="search"
            placeholder="Disease, date, confidence…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={<Search />}
            wrapperClassName="sm:col-span-2 lg:col-span-1"
          />
          <Select label="Disease" value={disease} onChange={(event) => setDisease(event.target.value as typeof disease)}>
            <option value="all">All diseases</option>
            {DISEASES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Input label="From" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} />
          <Select label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="confidence-desc">Confidence: high to low</option>
            <option value="confidence-asc">Confidence: low to high</option>
            <option value="disease">Disease name</option>
          </Select>
        </div>
        {dateRangeInvalid && <p className="mt-3 text-sm text-danger">The “From” date is after the “To” date, so no scans can match.</p>}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-ink-muted">
              Showing <span className="font-semibold text-ink">{filtered.length}</span> of {scans.length} scans
            </p>
            <Button size="sm" variant="ghost" onClick={clearFilters} icon={<FilterX className="h-4 w-4" />}>
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      <Card padded={false} className="overflow-hidden">
        {showSkeleton ? (
          <div className="divide-y divide-line" role="status" aria-label="Loading scan history">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 sm:px-6">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="hidden h-4 w-20 sm:block" />
                <Skeleton className="hidden h-9 w-24 md:block" />
              </div>
            ))}
          </div>
        ) : scans.length === 0 && !error ? (
          <EmptyState
            title="No saved scans yet"
            description="Analyze a potato leaf image and choose “Save Result” — it will appear here with its image, prediction, and confidence."
            action={
              <Link to="/detect" className={buttonStyles()}>
                <ScanLine className="h-4 w-4" aria-hidden />
                Start Detection
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No scans match your filters"
            description="Try a different search term, disease, or date range."
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters} icon={<FilterX className="h-4 w-4" />}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-alt text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    <th scope="col" className="px-6 py-3.5">Scan</th>
                    <th scope="col" className="px-4 py-3.5">Classification</th>
                    <th scope="col" className="px-4 py-3.5">Confidence</th>
                    <th scope="col" className="px-4 py-3.5">Date &amp; time</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageRows.map((scan) => (
                    <tr key={scan.id} className="transition-colors hover:bg-surface-alt">
                      <td className="px-6 py-3.5">
                        <Link to={`/history/${scan.id}`} className="inline-block rounded-xl" aria-label={`View ${scan.predicted_disease} scan details`}>
                          <ScanThumb url={urls[scan.image_path]} loading={urlsLoading} alt={`${scan.predicted_disease} scan`} className="h-14 w-14" />
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <DiseaseBadge disease={scan.predicted_disease} />
                      </td>
                      <td className="px-4 py-3.5">
                        <ConfidenceMeter value={scan.confidence} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-ink">{formatDate(scan.scanned_at)}</p>
                        <p className="text-xs text-ink-faint">{formatTime(scan.scanned_at)}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Link to={`/history/${scan.id}`} className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                            <Eye className="h-4 w-4" aria-hidden />
                            View Details
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-9 px-0 text-danger hover:bg-danger-soft hover:text-danger"
                            onClick={() => setPendingDelete(scan)}
                            aria-label={`Delete ${scan.predicted_disease} scan from ${formatDateTime(scan.scanned_at)}`}
                            icon={<Trash2 className="h-4 w-4" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {pageRows.map((scan) => (
                <li key={scan.id} className="p-4">
                  <div className="flex gap-3.5">
                    <ScanThumb url={urls[scan.image_path]} loading={urlsLoading} alt={`${scan.predicted_disease} scan`} className="h-20 w-20 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <DiseaseBadge disease={scan.predicted_disease} />
                      <p className="tabular mt-2 text-lg font-extrabold text-ink">{formatPercent(scan.confidence)}</p>
                      <p className="text-xs text-ink-faint">{formatDateTime(scan.scanned_at)}</p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex gap-2">
                    <Link to={`/history/${scan.id}`} className={buttonStyles({ variant: 'outline', size: 'md', className: 'flex-1' })}>
                      <Eye className="h-4 w-4" aria-hidden />
                      View Details
                    </Link>
                    <Button
                      variant="outline"
                      className="w-11 px-0 text-danger hover:border-danger hover:bg-danger-soft"
                      onClick={() => setPendingDelete(scan)}
                      aria-label={`Delete ${scan.predicted_disease} scan from ${formatDateTime(scan.scanned_at)}`}
                      icon={<Trash2 className="h-4 w-4" />}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-line bg-surface-alt px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3 text-sm text-ink-muted">
                <span>
                  <span className="font-semibold text-ink">{firstRow}–{lastRow}</span> of {filtered.length}
                </span>
                <label className="flex items-center gap-2">
                  <span className="sr-only sm:not-sr-only">Rows</span>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink focus:border-accent focus:outline-none"
                    aria-label="Rows per page"
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <span className="tabular px-2 text-sm font-medium text-ink-muted">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  iconRight={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this scan?"
        description={
          pendingDelete
            ? `The ${pendingDelete.predicted_disease} scan from ${formatDateTime(pendingDelete.scanned_at)} and its stored image will be permanently removed.`
            : ''
        }
        confirmLabel="Delete Scan"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear your entire scan history?"
        description={`All ${scans.length} saved ${scans.length === 1 ? 'scan' : 'scans'} and their stored images will be permanently deleted. This cannot be undone.`}
        confirmLabel="Clear History"
        loading={clearing}
        onConfirm={() => void handleClear()}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
