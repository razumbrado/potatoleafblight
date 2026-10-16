import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, api } from '@/services/api';
import { classifyImage } from '@/services/model';
import type { BackendHealth, ClassificationResult, ModelInfo, ModelStatus } from '@/types';
import { getErrorMessage } from '@/utils/format';

interface ModelContextValue {
  /** 'ready' only when the Python backend is reachable AND a trained model is loaded. */
  status: ModelStatus;
  health: BackendHealth | null;
  info: ModelInfo | null;
  error: string | null;
  /** Checks the backend if it has not been checked yet. Safe to call repeatedly. */
  ensureLoaded: () => void;
  /** Checks the backend again (e.g. after starting it or retraining). */
  reload: () => void;
  classify: (file: File) => Promise<ClassificationResult>;
}

const ModelContext = createContext<ModelContextValue | null>(null);
const RETRY_DELAY_MS = 15_000;

export function ModelProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ModelStatus>('idle');
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const start = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');
    setError(null);
    api
      .health()
      .then(async (result) => {
        setHealth(result);
        if (!result.model_available) {
          setInfo(null);
          throw new ApiError(result.detail ?? 'The backend is running, but no trained model is available yet.', 503, 'model_not_trained');
        }
        setInfo(await api.modelInfo());
        setStatus('ready');
      })
      .catch((cause) => {
        setError(getErrorMessage(cause, 'The classification server could not be reached.'));
        setStatus('error');
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, []);

  const ensureLoaded = useCallback(() => {
    if (status === 'idle') start();
  }, [status, start]);

  // A hosted backend (e.g. a sleeping Hugging Face Space) can take a minute or two to wake up,
  // so keep checking quietly instead of leaving the workspace stuck on "unavailable".
  useEffect(() => {
    if (status !== 'error') return;
    const timer = window.setTimeout(start, RETRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status, start]);

  const classify = useCallback(
    async (file: File) => {
      try {
        return await classifyImage(file);
      } catch (cause) {
        // A lost connection or missing model changes what the rest of the UI should show.
        if (cause instanceof ApiError && (cause.status === null || cause.modelNotTrained)) {
          setError(cause.message);
          setStatus('error');
        }
        throw cause;
      }
    },
    [],
  );

  const value = useMemo<ModelContextValue>(
    () => ({ status, health, info, error, ensureLoaded, reload: start, classify }),
    [status, health, info, error, ensureLoaded, start, classify],
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModel must be used inside ModelProvider');
  return context;
}
