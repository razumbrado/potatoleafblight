import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { classifyImage, loadModel } from '@/services/model';
import type { ClassificationResult, ModelInfo, ModelStatus } from '@/types';
import { getErrorMessage } from '@/utils/format';

interface ModelContextValue {
  status: ModelStatus;
  info: ModelInfo | null;
  error: string | null;
  /** Starts loading the model if it is not loaded yet. Safe to call repeatedly. */
  ensureLoaded: () => void;
  /** Clears a failed load and tries again. */
  reload: () => void;
  classify: (image: HTMLImageElement | HTMLCanvasElement) => Promise<ClassificationResult>;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ModelStatus>('idle');
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const start = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');
    setError(null);
    loadModel()
      .then(({ info: loadedInfo }) => {
        setInfo(loadedInfo);
        setStatus('ready');
      })
      .catch((cause) => {
        setError(getErrorMessage(cause, 'The AI model could not be loaded.'));
        setStatus('error');
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, []);

  const ensureLoaded = useCallback(() => {
    if (status === 'idle') start();
  }, [status, start]);

  const value = useMemo<ModelContextValue>(
    () => ({ status, info, error, ensureLoaded, reload: start, classify: classifyImage }),
    [status, info, error, ensureLoaded, start],
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModel must be used inside ModelProvider');
  return context;
}
