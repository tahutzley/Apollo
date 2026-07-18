# Deployment

## GitHub Pages (recommended)

This repository includes `.github/workflows/deploy-pages.yml`. Every push to `main` builds the Vite application and deploys `dist/` to GitHub Pages.

### First publication

1. Create a GitHub repository and upload this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions** and allow the `Deploy Apollo 11 Experience` workflow to complete.
5. The public URL appears in the workflow summary and in **Settings → Pages**.

Because the Vite base path is relative (`./`), the app works at both a user-site root and a project subdirectory such as `https://username.github.io/apollo-11-experience/`.

### Install on iPhone

1. Open the published HTTPS URL in Safari.
2. Let the opening screen and first scene finish loading.
3. Tap **Share**.
4. Choose **Add to Home Screen**.
5. Enable **Open as Web App** when shown, then tap **Add**.

The service worker caches the application shell and locally used assets. The optional high-detail NASA Lunar Module model requires a network connection the first time it is requested; the bundled procedural model remains available offline.

## Other static hosts

Run:

```bash
npm ci
npm run build
```

Upload the contents of `dist/` to any HTTPS static host, including Netlify, Cloudflare Pages, Vercel, or an S3-compatible website host. Do not upload the source directory as the published site unless the provider is configured to run the build command.

Recommended settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Node.js: 20 or newer

## Local network preview

```bash
npm ci
npm run build
npm run preview
```

Open the printed LAN address from an iPhone connected to the same Wi-Fi network. Local HTTP preview is suitable for testing, but Home Screen installation and reliable service-worker behavior require HTTPS in production.
