import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { clearAllScans, deleteScan, fetchAllScans, saveScan } from '@/services/scans';
import type { ClassificationResult, ScanRecord } from '@/types';
import { getErrorMessage } from '@/utils/format';
import { useAuth } from './AuthContext';

interface ScansContextValue {
  /** The signed-in user's scans from Supabase, newest first. Empty for guests. */
  scans: ScanRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (file: File, result: ClassificationResult) => Promise<ScanRecord>;
  remove: (scan: ScanRecord) => Promise<void>;
  clearAll: () => Promise<number>;
}

const ScansContext = createContext<ScansContextValue | null>(null);

const newestFirst = (a: ScanRecord, b: ScanRecord) =>
  new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime();

/**
 * Single source of truth for scan records. History and Analytics both read from here,
 * so saving or deleting a scan updates every view immediately.
 */
export function ScansProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++requestId.current;
    if (!userId) {
      setScans([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllScans(userId);
      if (current === requestId.current) setScans(rows);
    } catch (cause) {
      if (current === requestId.current) {
        setError(getErrorMessage(cause, 'Could not load your scan history.'));
      }
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (file: File, result: ClassificationResult) => {
      if (!userId) throw new Error('Sign in to save scans to your history.');
      const row = await saveScan({ userId, file, result });
      setScans((previous) => [row, ...previous].sort(newestFirst));
      return row;
    },
    [userId],
  );

  const remove = useCallback(async (scan: ScanRecord) => {
    await deleteScan(scan);
    setScans((previous) => previous.filter((item) => item.id !== scan.id));
  }, []);

  const clearAll = useCallback(async () => {
    if (!userId) throw new Error('Sign in to manage your scan history.');
    try {
      const count = await clearAllScans(userId);
      setScans([]);
      return count;
    } catch (cause) {
      // A partial failure may have removed some images; reload to show the true state.
      void refresh();
      throw cause;
    }
  }, [userId, refresh]);

  const value = useMemo(
    () => ({ scans, loading, error, refresh, save, remove, clearAll }),
    [scans, loading, error, refresh, save, remove, clearAll],
  );

  return <ScansContext.Provider value={value}>{children}</ScansContext.Provider>;
}

export function useScans() {
  const context = useContext(ScansContext);
  if (!context) throw new Error('useScans must be used inside ScansProvider');
  return context;
}
