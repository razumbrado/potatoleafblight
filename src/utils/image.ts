import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants';
import { formatFileSize } from './format';

/** Returns an error message when the file is not an acceptable image, otherwise null. */
export function validateImageFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const typeOk = (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type);
  const extOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  // Some platforms report an empty MIME type, so fall back to the extension in that case only.
  if (!(typeOk || (file.type === '' && extOk))) {
    return 'Unsupported file type. Please choose a JPG, JPEG, PNG, or WEBP image.';
  }
  if (file.size === 0) return 'This file is empty. Please choose another image.';
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `This image is ${formatFileSize(file.size)}. The maximum file size is 10 MB.`;
  }
  return null;
}

/** Decodes an image URL into an HTMLImageElement; rejects when the data is not a readable image. */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('The image could not be decoded. Please choose another file.'));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error('The image could not be read. It may be corrupted or not a real image file.'));
    img.src = src;
  });
}

export function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
