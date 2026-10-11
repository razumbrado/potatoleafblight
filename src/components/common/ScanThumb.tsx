import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ScanThumbProps {
  url?: string;
  loading?: boolean;
  alt: string;
  className?: string;
}

/** Square thumbnail for a stored scan image, with skeleton and missing-image states. */
export function ScanThumb({ url, loading, alt, className }: ScanThumbProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-subtle', className)}>
      {url && !failed ? (
        <>
          {!loaded && <div className="skeleton absolute inset-0 rounded-none" />}
          <img
            src={url}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn('h-full w-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          />
        </>
      ) : loading ? (
        <div className="skeleton absolute inset-0 rounded-none" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-faint" title="Image unavailable">
          <ImageOff className="h-4 w-4" aria-label="Image unavailable" />
        </div>
      )}
    </div>
  );
}
