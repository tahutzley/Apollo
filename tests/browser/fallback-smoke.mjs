import puppeteer from 'puppeteer-core';
import path from 'path';
import { interceptProductionBuild, loadProductionDocument } from './dist-intercept.mjs';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: false,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-webgl', '--disable-webgl2']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await interceptProductionBuild(page, dist);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.setContent(loadProductionDocument(dist), { waitUntil: 'load' });
await page.waitForSelector('.begin-button');
await page.click('.begin-button');
await page.waitForSelector('.accessible-story', { timeout: 10000 });
const firstTitle = await page.$eval('.story-poster h1', (element) => element.textContent);
const footerButtons = await page.$$('.story-footer button');
await footerButtons[2].click();
await page.waitForFunction((title) => document.querySelector('.story-poster h1')?.textContent !== title, {}, firstTitle);
const state = await page.evaluate(() => ({
  story: Boolean(document.querySelector('.accessible-story')),
  canvas: Boolean(document.querySelector('canvas')),
  title: document.querySelector('.story-poster h1')?.textContent,
  index: document.querySelector('.accessible-header strong')?.textContent,
  bodyWidth: document.body.scrollWidth,
  viewportWidth: window.innerWidth,
  text: document.body.innerText.slice(0, 220)
}));
console.log(JSON.stringify({ state, errors }, null, 2));
if (!state.story || state.canvas || state.index !== '2 / 14' || state.bodyWidth > state.viewportWidth + 2 || errors.length) process.exitCode = 1;
await browser.close();
