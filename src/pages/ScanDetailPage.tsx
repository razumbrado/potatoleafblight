import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { ResultReport } from '@/components/detection/ResultReport';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useScans } from '@/contexts/ScansContext';
import { useSignedUrls } from '@/hooks/useSignedUrls';
import { describeScanModel, getErrorMessage, toLocalDateKey } from '@/utils/format';
import { downloadBlob } from '@/utils/image';
import { renderReportPng } from '@/utils/report';

export function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { scans, loading, remove } = useScans();
  const scan = scans.find((item) => item.id === id);
  const { urls, loading: urlLoading } = useSignedUrls(scan ? [scan.image_path] : []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const backLink = (
    <Link to="/history" className={buttonStyles({ variant: 'outline' })}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to History
    </Link>
  );

  if (!scan && loading) {
    return (
      <div role="status" aria-label="Loading scan">
        <Skeleton className="mb-8 h-9 w-64" />
        <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
          <Skeleton className="aspect-square rounded-2xl lg:aspect-auto lg:h-[420px]" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div>
        <PageHeader title="Scan Details" />
        <Card padded={false}>
          <EmptyState
            title="Scan not found"
            description="This scan may have been deleted, or it belongs to a different account."
            action={backLink}
          />
        </Card>
      </div>
    );
  }

  const imageUrl = urls[scan.image_path];
  const model = describeScanModel(scan);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove(scan);
      toast.success('Scan deleted.');
      navigate('/history', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'The scan could not be deleted.'));
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) {
      toast.error('The stored image is unavailable, so the report cannot be created.');
      return;
    }
    setDownloading(true);
    try {
      const blob = await renderReportPng({
        imageUrl,
        predictedDisease: scan.predicted_disease,
        confidence: scan.confidence,
        earlyBlightProbability: scan.early_blight_probability,
        lateBlightProbability: scan.late_blight_probability,
        dateIso: scan.scanned_at,
        modelLabel: model.label,
      });
      const slug = scan.predicted_disease.toLowerCase().replace(/\s+/g, '-');
      downloadBlob(blob, `blightvision-${slug}-${toLocalDateKey(new Date(scan.scanned_at))}.png`);
      toast.success('Report downloaded.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'The report could not be created.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Saved scan"
        title="Scan Details"
        description="A saved classification from your private history."
        actions={
          <>
            {backLink}
            <Button variant="outline" onClick={() => void handleDownload()} loading={downloading} icon={<Download className="h-4 w-4" />}>
              Download
            </Button>
            <Button variant="outline" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
              Print
            </Button>
            <Button
              variant="outline"
              className="text-danger hover:border-danger hover:bg-danger-soft"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete Scan
            </Button>
          </>
        }
      />

      <ResultReport
        imageUrl={imageUrl}
        imageLoading={urlLoading}
        predictedDisease={scan.predicted_disease}
        confidence={scan.confidence}
        earlyBlightProbability={scan.early_blight_probability}
        lateBlightProbability={scan.late_blight_probability}
        dateIso={scan.scanned_at}
        statusLabel="Saved to your history"
        modelLabel={model.label}
        legacyModel={model.legacy}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this scan?"
        description="The record and its stored image will be permanently removed from your account."
        confirmLabel="Delete Scan"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
