# Release validation

Release: 1.0.0
Build date: 2026-07-18

## Automated checks completed

- TypeScript project check completed without errors.
- Vite production build completed without errors.
- Generated service worker passes JavaScript syntax validation.
- Web app manifest passes JSON validation.
- WebGL-disabled launch correctly enters the Accessible Story instead of leaving a failed canvas.
- Accessible Story chapter navigation, semantic content, and 390 px viewport width passed.
- Mobile interaction smoke test passed for chapter selection, archival overlay, Engineering Atlas, settings, true-scale selection, accessible-story switching, return to 3D, and landscape rotation.
- Representative release scenes passed at 390 × 844 touch viewport: opening scale, launch complex, powered descent, EVA, reentry, and epilogue.
- Powered descent passed at 844 × 390 landscape touch viewport.
- All fourteen scene bundles were exercised individually at an iPhone-sized touch viewport during development.
- Final true-scale interaction passed with a live canvas, true-scale state, labeled Earth/Moon locators, and no application exceptions.

## Build characteristics

- Total static deployment size: approximately 4 MB before the optional remote NASA Lunar Module enhancement.
- Initial application code is separated from the Three.js mission renderer; the renderer is fetched after the user begins the experience.
- The application contains a bundled procedural Lunar Module and remains functional when the optional remote detail model cannot load.
- Production paths are relative so the site can be deployed at a domain root or subdirectory.

## Test-environment note

Automated visual checks used Chromium with a software WebGL renderer and iPhone-sized touch viewports. Software-rendered Chromium occasionally terminated during repeated isolated GPU sessions; affected chapters were rerun in fresh sessions and passed. This is not a substitute for final physical-device acceptance testing across the exact iPhone models and iOS versions selected for a public launch.
