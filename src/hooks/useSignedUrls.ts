import { useEffect, useState } from 'react';
import { getSignedUrls } from '@/services/scans';

/** Resolves private Storage paths to short-lived signed URLs. */
export function useSignedUrls(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(paths.length > 0);
  const key = paths.join('|');

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getSignedUrls(key.split('|'))
      .then((resolved) => {
        if (active) setUrls((previous) => ({ ...previous, ...resolved }));
      })
      .catch(() => {
        // Thumbnails fall back to a placeholder; the records themselves are still shown.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key]);

  return { urls, loading };
}
