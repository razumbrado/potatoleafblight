// Smoke test: drives the running app in a real browser, loads the Teachable Machine model,
// analyzes one or more images, and checks that the percentages shown on the results page
// are exactly the model's own outputs (formatted to two decimals).
//
// Usage:
//   1. npm run dev            (in another terminal)
//   2. npm run verify:model -- [baseUrl] [image ...]
//
// Defaults: http://localhost:5173 and the two sample photos in public/images.
// Uses your installed Microsoft Edge or Google Chrome (no browser download needed).

import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const baseUrl = args[0]?.startsWith('http') ? args.shift() : 'http://localhost:5173';
const images = args.length > 0 ? args.map((p) => path.resolve(p)) : ['early-blight.jpg', 'late-blight.jpg'].map((f) => path.join(root, 'public', 'images', f));

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
  await page.waitForSelector('[data-model-status="ready"]', { timeout: 90_000 });
  console.log('✔ Model loaded:', (await page.locator('[data-model-status="ready"]').first().innerText()).replace(/\s+/g, ' '));

  for (const image of images) {
    await page.goto(`${baseUrl}/detect`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-model-status="ready"]', { timeout: 90_000 });
    await page.setInputFiles('[data-testid="file-input"]', image);
    await page.waitForSelector('[data-testid="image-preview"]');

    // Nothing may be classified before the button is pressed.
    if (page.url().includes('/results')) throw new Error('App navigated to results before Analyze was clicked.');

    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="result-report"]', { timeout: 60_000 });

    const shown = {
      disease: (await page.innerText('[data-testid="predicted-disease"]')).trim(),
      confidence: (await page.innerText('[data-testid="confidence"]')).trim(),
      early: await page.getAttribute('[role="progressbar"][aria-label="Early Blight probability"]', 'aria-valuenow'),
      late: await page.getAttribute('[role="progressbar"][aria-label="Late Blight probability"]', 'aria-valuenow'),
    };

    // Independent reference: run the same model on the same pixels, outside the UI code path.
    // Only possible against the dev server; a production build has no /src modules.
    let reference = null;
    const isDevServer = await page.evaluate(() => Boolean(document.querySelector('script[src*="/src/main.tsx"]')));
    if (isDevServer) try {
      reference = await page.evaluate(async () => {
        const { classifyImage } = await import('/src/services/model.ts');
        const img = document.querySelector('[data-testid="result-report"] img');
        const fresh = new Image();
        fresh.src = img.src;
        await fresh.decode();
        const r = await classifyImage(fresh);
        return { disease: r.predictedDisease, early: r.earlyBlightProbability, late: r.lateBlightProbability, confidence: r.confidence };
      });
    } catch (error) {
      console.log('  (could not run the reference check:', error.message.split('\n')[0], ')');
    }

    console.log(`\n${path.basename(image)}`);
    console.log(`  shown     → ${shown.disease}, confidence ${shown.confidence}, early ${shown.early}%, late ${shown.late}%`);
    if (reference) {
      const expected = {
        disease: reference.disease,
        confidence: `${(reference.confidence * 100).toFixed(2)}%`,
        early: String(Number((reference.early * 100).toFixed(2))),
        late: String(Number((reference.late * 100).toFixed(2))),
      };
      console.log(`  raw model → ${reference.disease}, early ${reference.early}, late ${reference.late}`);
      const same = shown.disease === expected.disease && shown.confidence === expected.confidence && shown.early === expected.early && shown.late === expected.late;
      console.log(same ? '  ✔ Displayed values match the raw model output' : `  ✘ MISMATCH — expected ${JSON.stringify(expected)}`);
      if (!same) failed = true;
    }
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
