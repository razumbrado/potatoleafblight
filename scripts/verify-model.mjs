// Smoke test: drives the running app in a real browser, analyzes one or more images through the
// Python Random Forest backend, and checks that the percentages shown on the results page are
// exactly the backend's own predict_proba() outputs (formatted to two decimals).
//
// Usage:
//   1. Start the backend:   cd backend && .venv\Scripts\python -m uvicorn main:app --port 8000
//   2. Start the frontend:  npm run dev
//   3. npm run verify:model -- [baseUrl] [image ...]
//
// Defaults: http://localhost:5173, the API from VITE_API_BASE_URL (or http://localhost:8000),
// and the two sample photos in public/images. Uses your installed Microsoft Edge or Google Chrome.

import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const baseUrl = args[0]?.startsWith('http') ? args.shift() : 'http://localhost:5173';
const apiUrl = (process.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const images = args.length > 0 ? args.map((p) => path.resolve(p)) : ['early-blight.jpg', 'late-blight.jpg'].map((f) => path.join(root, 'public', 'images', f));

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

/** Independent reference: send the same file straight to the backend, outside the UI code path. */
async function referencePrediction(file) {
  const form = new FormData();
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  form.append('file', new Blob([await readFile(file)], { type }), path.basename(file));
  const response = await fetch(`${apiUrl}/api/predict`, { method: 'POST', body: form });
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}: ${await response.text()}`);
  return response.json();
}

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // try the next installed browser
    }
  }
  throw new Error('Could not find Microsoft Edge or Google Chrome to run the check.');
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
page.on('pageerror', (error) => consoleErrors.push(String(error)));

let failed = false;
try {
  await page.goto(`${baseUrl}/detect`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-model-status="ready"]', { timeout: 30_000 });
  console.log('✔ Model server ready');

  for (const image of images) {
    await page.goto(`${baseUrl}/detect`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-model-status="ready"]', { timeout: 30_000 });
    await page.setInputFiles('[data-testid="file-input"]', image);
    await page.waitForSelector('[data-testid="image-preview"]');

    // Nothing may be classified before the button is pressed.
    if (page.url().includes('/results')) throw new Error('App navigated to results before Analyze was clicked.');

    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="result-report"]', { timeout: 60_000 });

    // The result page shows only the predicted class and its probability.
    const disease = (await page.innerText('[data-testid="predicted-disease"]')).trim();
    const shown = {
      disease,
      confidence: (await page.innerText('[data-testid="confidence"]')).trim(),
      bar: await page.getAttribute(`[role="progressbar"][aria-label="${disease} probability"]`, 'aria-valuenow'),
      model: (await page.innerText('[data-testid="model-label"]')).trim(),
    };

    const reference = await referencePrediction(image);
    const expected = {
      disease: reference.predicted_class,
      confidence: `${(reference.confidence * 100).toFixed(2)}%`,
      bar: String(Number((reference.probabilities[reference.predicted_class] * 100).toFixed(2))),
    };

    console.log(`\n${path.basename(image)}`);
    console.log(`  shown   → ${shown.disease}, confidence ${shown.confidence}, bar ${shown.bar}% (${shown.model})`);
    console.log(`  backend → ${reference.predicted_class}, probability ${reference.probabilities[reference.predicted_class]} (${reference.model} ${reference.model_version})`);
    const same = shown.disease === expected.disease && shown.confidence === expected.confidence && shown.bar === expected.bar;
    console.log(same ? '  ✔ Displayed values match the backend output' : `  ✘ MISMATCH — expected ${JSON.stringify(expected)}`);
    if (!same) failed = true;
  }

  if (consoleErrors.length > 0) {
    console.log('\nBrowser console errors:');
    consoleErrors.forEach((line) => console.log('  •', line));
  }
} catch (error) {
  failed = true;
  console.error('\n✘ Check failed:', error.message);
  if (consoleErrors.length > 0) consoleErrors.forEach((line) => console.error('  •', line));
} finally {
  await browser.close();
}

process.exit(failed ? 1 : 0);
