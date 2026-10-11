import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { DiseaseBadge } from '@/components/common/DiseaseBadge';
import { ScanThumb } from '@/components/common/ScanThumb';
import { useSignedUrls } from '@/hooks/useSignedUrls';
import type { ScanRecord } from '@/types';
import { formatPercent, formatRelative } from '@/utils/format';
import { ChartEmpty } from './ChartParts';

export function RecentActivity({ scans }: { scans: ScanRecord[] }) {
  const { urls, loading } = useSignedUrls(scans.map((scan) => scan.image_path));

  if (scans.length === 0) return <ChartEmpty message="No scan activity in this period yet." height={220} />;

  return (
    <ul className="-mx-2 divide-y divide-line">
      {scans.map((scan) => (
        <li key={scan.id}>
          <Link
            to={`/history/${scan.id}`}
            className="group flex items-center gap-3.5 rounded-xl px-2 py-3 transition-colors hover:bg-surface-alt"
          >
            <ScanThumb url={urls[scan.image_path]} loading={loading} alt={`${scan.predicted_disease} scan`} />
            <div className="min-w-0 flex-1">
              <DiseaseBadge disease={scan.predicted_disease} />
              <p className="mt-1 truncate text-xs text-ink-faint">{formatRelative(scan.scanned_at)}</p>
            </div>
            <span className="tabular text-sm font-bold text-ink">{formatPercent(scan.confidence)}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
