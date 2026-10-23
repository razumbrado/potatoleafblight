import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CloudUpload, Download, History, Printer, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { ResultReport } from '@/components/detection/ResultReport';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useDetection } from '@/contexts/DetectionContext';
import { useScans } from '@/contexts/ScansContext';
import { getErrorMessage, toLocalDateKey } from '@/utils/format';
import { downloadBlob } from '@/utils/image';
import { renderReportPng } from '@/utils/report';

export function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, configured } = useAuth();
  const { save } = useScans();
  const { file, previewUrl, result, savedScanId, markSaved, reset } = useDetection();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!file || !previewUrl || !result) {
    return (
      <div>
        <PageHeader title="Classification Result" />
        <Card padded={false}>
          <EmptyState
            title="No result to show yet"
            description="Results appear here after you analyze an image. They are kept only while this tab stays open unless you save them to your history."
            action={
              <Link to="/detect" className={buttonStyles()}>
                <ScanLine className="h-4 w-4" aria-hidden />
                Go to Detection
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const handleAnother = () => {
    reset();
    navigate('/detect');
  };

  const handleSave = async () => {
    if (savedScanId) return;
    if (!configured) {
      toast.error('Saving needs a Supabase project. Add your Supabase keys to .env (see the README).');
      return;
    }
    if (!user) {
      toast.info('Sign in to save this result to your scan history.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSaving(true);
    try {
      const row = await save(file, result);
      markSaved(row.id);
      toast.success('Result saved to your scan history.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'The result could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await renderReportPng({
        imageUrl: previewUrl,
        predictedDisease: result.predictedDisease,
        confidence: result.confidence,
        earlyBlightProbability: result.earlyBlightProbability,
        lateBlightProbability: result.lateBlightProbability,
        dateIso: result.analyzedAt,
        modelLabel: `${result.modelName} · ${result.modelVersion}`,
      });
      const slug = result.predictedDisease.toLowerCase().replace(/\s+/g, '-');
      downloadBlob(blob, `blightvision-${slug}-${toLocalDateKey(new Date(result.analyzedAt))}.png`);
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
        eyebrow="Classification report"
        title="Classification Result"
        description="Probabilities below are the direct predict_proba() outputs of the trained Random Forest for this image."
        actionsClassName="w-full flex-nowrap sm:w-auto"
        actions={
          <>
            <Button variant="outline" onClick={handleAnother} icon={<ScanLine className="h-4 w-4" />} className="flex-1 px-3 sm:flex-none sm:px-5">
              <span className="sm:hidden">Analyze New</span>
              <span className="hidden sm:inline">Analyze Another Image</span>
            </Button>
            <Button
              onClick={() => void handleSave()}
              loading={saving}
              disabled={Boolean(savedScanId)}
              icon={savedScanId ? <CheckCircle2 className="h-4 w-4" /> : <CloudUpload className="h-4 w-4" />}
              className="flex-1 px-3 sm:flex-none sm:px-5"
              data-testid="save-button"
            >
              {savedScanId ? 'Saved' : saving ? 'Saving…' : 'Save Result'}
            </Button>
          </>
        }
      />

      <ResultReport
        imageUrl={previewUrl}
        predictedDisease={result.predictedDisease}
        confidence={result.confidence}
        earlyBlightProbability={result.earlyBlightProbability}
        lateBlightProbability={result.lateBlightProbability}
        dateIso={result.analyzedAt}
        statusLabel={savedScanId ? 'Saved to your history' : undefined}
        modelLabel={`${result.modelName} · ${result.modelVersion}`}
      />

      <div className="card no-print mt-6 flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <p className="text-sm text-ink-muted">
          {savedScanId ? 'This result is stored in your private scan history.' : 'Unsaved results are cleared when you leave or refresh the app.'}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {savedScanId && (
            <Link to={`/history/${savedScanId}`} className={buttonStyles({ variant: 'secondary' })}>
              <History className="h-4 w-4" aria-hidden />
              Open in History
            </Link>
          )}
          <Button variant="outline" onClick={() => void handleDownload()} loading={downloading} icon={<Download className="h-4 w-4" />}>
            Download Result
          </Button>
          <Button variant="outline" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
            Print Result
          </Button>
        </div>
      </div>
    </div>
  );
}
