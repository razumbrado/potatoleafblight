import { MODEL_DISCLAIMER } from '@/lib/constants';
import { formatDateTime, formatPercent } from './format';
import { loadImageElement } from './image';

export interface ReportData {
  imageUrl: string;
  predictedDisease: string;
  confidence: number;
  earlyBlightProbability: number;
  lateBlightProbability: number;
  dateIso: string;
}

const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", Inter, system-ui, sans-serif';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

/** Renders the classification report as a PNG. Every number shown is the stored model output. */
export async function renderReportPng(data: ReportData): Promise<Blob> {
  const image = await loadImageElement(data.imageUrl);
  await document.fonts?.ready;

  const W = 1200;
  const H = 820;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create the report image.');

  // Page
  ctx.fillStyle = '#F1F8F3';
  ctx.fillRect(0, 0, W, H);

  // Header
  const header = ctx.createLinearGradient(0, 0, W, 0);
  header.addColorStop(0, '#12372A');
  header.addColorStop(1, '#1B4332');
  ctx.fillStyle = header;
  ctx.fillRect(0, 0, W, 112);
  ctx.fillStyle = '#74C69D';
  roundedRect(ctx, 48, 32, 48, 48, 13);
  ctx.fill();
  ctx.fillStyle = '#12372A';
  ctx.beginPath();
  ctx.moveTo(60, 68);
  ctx.bezierCurveTo(60, 54, 70, 44, 84, 44);
  ctx.bezierCurveTo(84, 58, 74, 68, 60, 68);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 28px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('BlightVision', 112, 46);
  ctx.fillStyle = '#B7DCC7';
  ctx.font = `500 16px ${FONT}`;
  ctx.fillText('Potato Leaf Blight Classification Report', 112, 74);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#D8F3DC';
  ctx.font = `500 16px ${FONT}`;
  ctx.fillText(formatDateTime(data.dateIso), W - 48, 56);
  ctx.textAlign = 'left';

  // Image (cover fit)
  const ix = 48;
  const iy = 152;
  const iw = 480;
  const ih = 480;
  ctx.save();
  roundedRect(ctx, ix, iy, iw, ih, 24);
  ctx.clip();
  const scale = Math.max(iw / image.naturalWidth, ih / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh);
  ctx.restore();

  // Result card
  const cx = 568;
  const cy = 152;
  const cw = W - cx - 48;
  const ch = 480;
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, cx, cy, cw, ch, 24);
  ctx.fill();
  ctx.strokeStyle = '#DCEAE1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const px = cx + 40;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#2D6A4F';
  ctx.font = `700 14px ${FONT}`;
  ctx.fillText('MODEL PREDICTION', px, cy + 58);
  ctx.fillStyle = '#11281E';
  ctx.font = `800 50px ${FONT}`;
  ctx.fillText(data.predictedDisease, px, cy + 116);
  ctx.fillStyle = '#4C675A';
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText('Prediction confidence', px, cy + 162);
  ctx.fillStyle = '#12372A';
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(formatPercent(data.confidence), px, cy + 212);

  const bars: [string, number, string][] = [
    ['Early Blight', data.earlyBlightProbability, '#B8790F'],
    ['Late Blight', data.lateBlightProbability, '#1F7A52'],
  ];
  const barWidth = cw - 80;
  bars.forEach(([label, value, color], index) => {
    const by = cy + 280 + index * 86;
    ctx.fillStyle = '#11281E';
    ctx.font = `600 19px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, px, by);
    ctx.textAlign = 'right';
    ctx.font = `700 19px ${FONT}`;
    ctx.fillText(formatPercent(value), px + barWidth, by);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#E8F4EB';
    roundedRect(ctx, px, by + 16, barWidth, 14, 7);
    ctx.fill();
    const fill = Math.max(0, Math.min(1, value)) * barWidth;
    if (fill > 0) {
      ctx.fillStyle = color;
      roundedRect(ctx, px, by + 16, Math.max(fill, 14), 14, 7);
      ctx.fill();
    }
  });

  // Disclaimer
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, 48, 664, W - 96, 112, 18);
  ctx.fill();
  ctx.strokeStyle = '#DCEAE1';
  ctx.stroke();
  ctx.fillStyle = '#2D6A4F';
  ctx.font = `700 14px ${FONT}`;
  ctx.fillText('IMPORTANT', 76, 700);
  ctx.fillStyle = '#4C675A';
  ctx.font = `500 16px ${FONT}`;
  wrapText(ctx, MODEL_DISCLAIMER, 76, 728, W - 152, 24);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the report image.'))), 'image/png');
  });
}
