import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Camera, FolderOpen, UploadCloud } from 'lucide-react';
import { pillPrimary, pillSecondary } from '@/components/ios/Ios';
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
  // Phones and tablets cannot drag files into a page, so they get upload/camera wording instead.
  const [touchDevice] = useState(() => {
    try {
      return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    } catch {
      return false;
    }
  });

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
      aria-label={touchDevice ? 'Upload a potato leaf image.' : 'Upload a potato leaf image. Drag and drop, or press Enter to browse.'}
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
      animate={{ scale: dragging ? 1.01 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'relative flex min-h-[220px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed px-6 py-6 text-center transition-colors duration-200',
        dragging
          ? 'border-pine-700 bg-pine-100'
          : 'border-pine-300/60 bg-[#F5FBF6] hover:border-pine-700/50 hover:bg-pine-100/50 dark:border-line-strong dark:bg-subtle',
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
        className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-pine-700 shadow-[0_6px_18px_-8px_rgb(11_43_38/0.3)] ring-1 ring-pine-100 dark:bg-surface dark:text-pine-300 dark:ring-line"
      >
        <UploadCloud className="h-7 w-7" aria-hidden />
      </motion.div>

      <h2 className="mt-3 text-xl font-extrabold tracking-[-0.01em] text-pine-900 sm:text-[22px] dark:text-ink">
        {dragging ? 'Drop the image to upload' : touchDevice ? 'Upload a potato leaf image' : 'Drag & drop a potato leaf image'}
      </h2>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-muted">
        {touchDevice
          ? 'Choose a photo from your gallery or take one with the camera. JPG, JPEG, PNG, or WEBP — up to 10 MB.'
          : 'or choose a photo from your device. JPG, JPEG, PNG, or WEBP — up to 10 MB.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={browse} icon={<FolderOpen className="h-4 w-4" />} className={cn(pillPrimary, 'px-6')}>
          Browse Image
        </Button>
        <Button variant="outline" onClick={onOpenCamera} icon={<Camera className="h-4 w-4" />} className={cn(pillSecondary, 'px-6')}>
          Use Camera
        </Button>
      </div>
    </motion.div>
  );
}
