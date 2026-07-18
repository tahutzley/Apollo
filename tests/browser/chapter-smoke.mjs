import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { interceptProductionBuild, loadProductionDocument } from './dist-intercept.mjs';

const index = Number(process.argv[2]);
if (!Number.isInteger(index) || index < 0 || index > 13) throw new Error('Pass a chapter index from 0 through 13.');
const root = path.resolve(new URL('../..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const missionSource = fs.readFileSync(path.join(root, 'src/data/mission.ts'), 'utf8');
const durations = [...missionSource.matchAll(/visualDuration:\s*(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
const offsets = durations.map((_, chapterIndex) => durations.slice(0, chapterIndex).reduce((sum, value) => sum + value, 0));
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: false,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await interceptProductionBuild(page, dist);
const errors = [];
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  const text = message.text();
  if (text.includes('Failed to load resource') && text.includes('404')) return;
  errors.push(text);
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('error', (error) => errors.push(`Page crash: ${error.message}`));
await page.setContent(loadProductionDocument(dist), { waitUntil: 'load' });
await page.waitForSelector('.begin-button');
await page.click('.begin-button');
await page.waitForSelector('canvas', { timeout: 10000 });
await page.click('.play-button');
await page.click('.chapter-identity');
await page.waitForSelector('.chapter-picker');
const buttons = await page.$$('.chapter-list > button');
await buttons[index].click();
await page.$eval('input[aria-label="Mission timeline"]', (input, nextValue) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, String(nextValue));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, offsets[index] + durations[index] * 0.94);
await new Promise((resolve) => setTimeout(resolve, 320));
const state = await page.evaluate(() => ({
  title: document.querySelector('.chapter-identity strong')?.textContent,
  progress: document.querySelector('.timeline-progress-row > span:last-child')?.textContent,
  canvas: Boolean(document.querySelector('canvas')),
  storyFallback: Boolean(document.querySelector('.accessible-story')),
  bodyWidth: document.body.scrollWidth,
  viewportWidth: window.innerWidth
}));
await browser.close();
console.log(JSON.stringify({ index, state, errors }));
if (errors.length || !state.canvas || state.storyFallback || state.bodyWidth > state.viewportWidth + 2) process.exitCode = 1;
