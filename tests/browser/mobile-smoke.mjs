import puppeteer from 'puppeteer-core';
import path from 'path';
import { interceptProductionBuild, loadProductionDocument } from './dist-intercept.mjs';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: false,
  args: [
    '--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle',
    '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'
  ]
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await interceptProductionBuild(page, dist);
const errors = [];
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  const text = message.text();
  if (text.includes('Failed to load resource') && text.includes('404')) return;
  errors.push(text);
});
page.on('pageerror', (error) => errors.push(error.message));

await page.setContent(loadProductionDocument(dist), { waitUntil: 'load' });
await page.waitForSelector('.begin-button');
await page.click('.begin-button');
await page.waitForSelector('canvas', { timeout: 10000 });
await new Promise((resolve) => setTimeout(resolve, 900));

await page.click('.play-button');
await page.click('.chapter-identity');
await page.waitForSelector('.chapter-picker');
const chapters = await page.$$('.chapter-list > button');
await chapters[1].click();
await new Promise((resolve) => setTimeout(resolve, 500));

await page.click('.sheet-handle');
await page.waitForSelector('.bottom-sheet.open');
const tabButtons = await page.$$('.sheet-tabs button');
await tabButtons[4].click();
await page.waitForSelector('.source-list');
const archiveCard = await page.$('.archive-card');
if (archiveCard) {
  await archiveCard.click();
  await page.waitForSelector('.archive-overlay');
  await page.screenshot({ path: path.join(root, 'preview', 'archive-comparison-mobile.png') });
  await page.click('.archive-overlay-panel button[aria-label="Close archival reference"]');
}

const tabsAfterArchive = await page.$$('.sheet-tabs button');
await tabsAfterArchive[3].click();
await page.waitForSelector('.atlas-controls');
const explodedButton = await page.$('.atlas-controls > button');
if (explodedButton) await explodedButton.click();
await page.screenshot({ path: path.join(root, 'preview', 'engineering-atlas-mobile.png') });
await page.click('.sheet-handle');

await page.click('button[aria-label="Open settings"]');
await page.waitForSelector('.settings-panel');
const qualityButtons = await page.$$('.quality-options button');
await qualityButtons[2].click();
const toggleButtons = await page.$$('.settings-toggles button');
await toggleButtons[0].click();
await page.screenshot({ path: path.join(root, 'preview', 'settings-mobile.png') });
const compactActions = await page.$$('.compact-actions button');
await compactActions[0].click();
await page.waitForSelector('.accessible-story');
await page.screenshot({ path: path.join(root, 'preview', 'accessible-story-mobile.png'), fullPage: true });
await page.click('.story-return');
await page.waitForSelector('canvas');

await page.click('.chapter-identity');
await page.waitForSelector('.chapter-picker');
const chapterButtons = await page.$$('.chapter-list > button');
await chapterButtons[0].click();
await page.click('.sheet-handle');
const scaleTabs = await page.$$('.sheet-tabs button');
await scaleTabs[3].click();
const segmented = await page.$$('.segmented button');
if (segmented.length) await segmented[0].click();
await page.click('.sheet-handle');
await new Promise((resolve) => setTimeout(resolve, 500));
await page.screenshot({ path: path.join(root, 'preview', 'true-scale-mobile.png') });

await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await new Promise((resolve) => setTimeout(resolve, 450));
await page.screenshot({ path: path.join(root, 'preview', 'landscape-mobile.png') });

const result = await page.evaluate(() => ({
  title: document.querySelector('.chapter-identity strong')?.textContent,
  hasCanvas: Boolean(document.querySelector('canvas')),
  hasTimeline: Boolean(document.querySelector('.timeline-controls')),
  viewport: [window.innerWidth, window.innerHeight],
  bodyWidth: document.body.scrollWidth,
  visibleText: document.body.innerText.slice(0, 240)
}));

console.log(JSON.stringify({ result, errors }, null, 2));
if (!result.hasCanvas || !result.hasTimeline || result.bodyWidth > result.viewport[0] + 2 || errors.length) process.exitCode = 1;
await browser.close();
