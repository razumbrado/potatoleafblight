import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Camera, FolderOpen, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from '@/lib/constants';
import { cn } from '@/utils/cn';

interface UploadZoneProps {
  onFile: (file: File) => void;
  onOpenCamera: () => void;
  /** Reports problems that are not about a specific file (e.g. several files dropped). */
  onReject: (message: string) => void;
}

export const ACCEPT_ATTRIBUTE = [...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS].join(',');

export function UploadZone({ onFile, onOpenCamera, onReject }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const browse = () => inputRef.current?.click();

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) {
      onReject('That item is not a file. Drop a JPG, PNG, or WEBP image from your device.');
      return;
    }
    if (files.length > 1) {
      onReject('Please drop one image at a time.');
      return;
    }
    onFile(files[0]);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      browse();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Upload a potato leaf image. Drag and drop, or press Enter to browse."
      onKeyDown={handleKey}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={handleDrop}
      animate={{ scale: dragging ? 1.012 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'leaf-pattern relative flex min-h-[380px] flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-200',
        dragging ? 'border-accent bg-accent-soft' : 'border-soft/70 bg-accent-soft/40 hover:border-accent/70 dark:border-line-strong',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />

      <motion.div
        animate={{ y: dragging ? -6 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface text-accent shadow-card ring-1 ring-line"
      >
        <UploadCloud className="h-9 w-9" aria-hidden />
      </motion.div>

      <h2 className="mt-6 text-xl font-extrabold text-ink sm:text-2xl">
        {dragging ? 'Drop the image to upload' : 'Drag & drop a potato leaf image'}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        or choose a photo from your device. JPG, JPEG, PNG, or WEBP — up to 10 MB.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={browse} icon={<FolderOpen className="h-4 w-4" />}>
          Browse Image
        </Button>
        <Button variant="outline" onClick={onOpenCamera} icon={<Camera className="h-4 w-4" />}>
          Use Camera
        </Button>
      </div>
    </motion.div>
  );
}
