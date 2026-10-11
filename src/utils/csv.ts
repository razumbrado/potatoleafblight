import type { ScanRecord } from '@/types';
import { downloadBlob } from './image';
import { toLocalDateKey } from './format';

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function scansToCsv(scans: ScanRecord[]): string {
  const header = [
    'Scan ID',
    'Scanned At (ISO)',
    'Scanned At (Local)',
    'Predicted Disease',
    'Confidence (%)',
    'Early Blight Probability (%)',
    'Late Blight Probability (%)',
    'Image Path',
  ];
  const rows = scans.map((scan) => [
    scan.id,
    scan.scanned_at,
    new Date(scan.scanned_at).toLocaleString(),
    scan.predicted_disease,
    (scan.confidence * 100).toFixed(2),
    (scan.early_blight_probability * 100).toFixed(2),
    (scan.late_blight_probability * 100).toFixed(2),
    scan.image_path,
  ]);
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function exportScansCsv(scans: ScanRecord[]) {
  // BOM so Excel opens the file as UTF-8.
  const blob = new Blob(['﻿', scansToCsv(scans)], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `blightvision-scan-history-${toLocalDateKey(new Date())}.csv`);
}
