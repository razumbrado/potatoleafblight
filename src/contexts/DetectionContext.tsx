import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ClassificationResult } from '@/types';

interface DetectionContextValue {
  /** The image currently in the workspace (uploaded or captured). */
  file: File | null;
  previewUrl: string | null;
  /** The latest real model output for `file`, or null if it has not been analyzed. */
  result: ClassificationResult | null;
  /** Id of the scan_history row once this result has been saved. */
  savedScanId: string | null;
  setImage: (file: File) => void;
  setResult: (result: ClassificationResult) => void;
  markSaved: (scanId: string) => void;
  reset: () => void;
}

const DetectionContext = createContext<DetectionContextValue | null>(null);

/** Keeps the working image and its result alive while the user moves between pages. */
export function DetectionProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResultState] = useState<ClassificationResult | null>(null);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const revoke = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  const setImage = useCallback((next: File) => {
    revoke();
    const url = URL.createObjectURL(next);
    urlRef.current = url;
    setFile(next);
    setPreviewUrl(url);
    setResultState(null);
    setSavedScanId(null);
  }, []);

  const reset = useCallback(() => {
    revoke();
    setFile(null);
    setPreviewUrl(null);
    setResultState(null);
    setSavedScanId(null);
  }, []);

  const setResult = useCallback((next: ClassificationResult) => {
    setResultState(next);
    setSavedScanId(null);
  }, []);

  useEffect(() => revoke, []);

  const value = useMemo(
    () => ({ file, previewUrl, result, savedScanId, setImage, setResult, markSaved: setSavedScanId, reset }),
    [file, previewUrl, result, savedScanId, setImage, setResult, reset],
  );

  return <DetectionContext.Provider value={value}>{children}</DetectionContext.Provider>;
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error('useDetection must be used inside DetectionProvider');
  return context;
}
