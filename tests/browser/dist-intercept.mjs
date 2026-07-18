import fs from 'fs';
import path from 'path';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary'
};

export async function interceptProductionBuild(page, dist, { offlineNasa = true } = {}) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    try {
      const url = new URL(request.url());
      if (offlineNasa && url.hostname === 'raw.githubusercontent.com') {
        request.respond({ status: 404, contentType: 'text/plain', headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Offline QA uses the built-in optimized Lunar Module.' });
        return;
      }
      if (url.hostname === 'apollo.local') {
        const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.replace(/^\//, ''));
        const filePath = path.resolve(dist, relative);
        if (filePath.startsWith(path.resolve(dist)) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          request.respond({
            status: 200,
            contentType: types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: fs.readFileSync(filePath)
          });
          return;
        }
        request.respond({ status: 404, contentType: 'text/plain', body: 'Not found' });
        return;
      }
    } catch {}
    request.continue();
  });
}

export function loadProductionDocument(dist) {
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  return html.replace('<head>', '<head><base href="https://apollo.local/">');
}
