# QA Report

## Automated validation included

- TypeScript project build
- Vite production build
- Mobile portrait smoke flow
- Landscape reflow
- Chapter-specific render checks
- WebGL-disabled Accessible Story fallback
- Horizontal-overflow checks

The browser checks are located in `tests/browser/` and use Puppeteer with an iPhone-shaped viewport.

## Commands

```bash
npm ci
npm run check
npm run build
npm run qa:mobile
npm run qa:fallback
npm run qa:chapter -- 8
```

The Linux browser commands expect Chromium and Xvfb. Production deployment does not depend on those QA packages being present at runtime.

## Publication acceptance checklist

Before broad release, verify on at least one physical iPhone:

- Portrait and landscape orientation changes preserve mission state.
- Audio starts after the **Begin Mission** gesture.
- Timeline scrubbing does not duplicate effects.
- The bottom sheet stays above the Home indicator.
- Add to Home Screen launches in standalone mode.
- The app opens after airplane mode is enabled once the active chapter has been cached.
- Battery mode remains stable during a twenty-minute descent/EVA session.
- VoiceOver can reach the Accessible Story controls.

## Known boundary

The experience is an educational reconstruction, not a flight-certified simulator. Several vehicle paths, attitudes, and secondary visual effects are reconstructed or illustrative and are labeled accordingly inside the application.
