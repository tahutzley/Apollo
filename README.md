# Apollo 11 — From Earth to Tranquility

A complete mobile-first 3D web experience that follows Apollo 11 from the scale of the Earth–Moon system through launch, staging, Earth orbit, translunar injection, docking, lunar orbit, powered descent, surface operations, ascent, rendezvous, return, reentry, splashdown, and the complete mission epilogue.

The project is a finished, deployable Vite application rather than a static concept. It includes fourteen interactive chapters, a deterministic mission timeline, touch navigation, engineering inspection, archival comparisons, an accessible non-3D story, adaptive quality modes, PWA support, and renderer-failure recovery.

## Experience highlights

- Fourteen mission chapters covering the full Apollo 11 journey
- Portrait-first iPhone interface with a dedicated landscape cinema layout
- Touch orbit, pinch zoom, object selection, guided-camera recovery, and timeline scrubbing
- True relative Earth–Moon scale and clearly labeled educational compression
- Saturn V launch and staging, CSM/LM docking, translunar coast, powered descent, EVA, ascent, rendezvous, reentry, parachutes, and splashdown
- Mission elapsed time, interpolated telemetry, chapter objectives, communications, inspectable systems, and source references
- Engineering Atlas with exploded views and scene-specific components
- Archival-image comparison overlays with adjustable reconstruction opacity
- Procedural Web Audio soundscape that starts only after a user gesture
- Adaptive High, Balanced, and Battery quality tiers
- Online enhancement using NASA’s detailed Apollo Lunar Module GLB
- Fully bundled procedural Lunar Module fallback for offline use or failed model loading
- Installable Progressive Web App with an offline application shell
- Accessible Story fallback with all chapter narratives, telemetry, communications, images, and primary references
- Reduced-motion support, semantic live updates, scalable text, and keyboard-accessible controls

## Mission chapters

1. The Distance
2. Launch Complex 39A
3. Staging to Orbit
4. Earth Parking Orbit
5. Translunar Injection
6. Docking and Extraction
7. Translunar Coast
8. Lunar Orbit
9. Powered Descent
10. One Small Step
11. Return to Columbia
12. Homeward
13. Reentry and Splashdown
14. The Complete Journey

## Run the source project

Requirements:

- Node.js 20 or newer
- npm 10 or newer

```bash
npm install
npm run dev
```

Open the local address printed by Vite. To test from an iPhone on the same network, use the computer’s LAN address rather than `localhost`, and allow the development server through the local firewall.

## Build the production version

```bash
npm run check
npm run build
npm run preview
```

The deployable output is written to `dist/`.

The application uses relative asset paths, so it can be deployed at a domain root or a subdirectory. PWA installation and service-worker caching require HTTPS in production.

## Mobile controls

- **Drag:** orbit or look around the active scene
- **Pinch:** zoom
- **Tap:** inspect a selectable object
- **Timeline drag:** scrub within or across chapters
- **Chapter heading:** open the mission chapter picker
- **Bottom-sheet handle:** expand mission, data, communications, engineering, or source information
- **Target button:** return to the guided camera after exploring freely
- **Landscape rotation:** switch to the compact cinema layout without losing mission state

## Architecture

```text
src/
  App.tsx                       Application state and mission playback
  audio/SoundEngine.ts         Procedural Web Audio soundscape
  components/                  Mobile interface and accessible story
  data/mission.ts              Fourteen chapters, timing, telemetry, transcripts, sources
  scene/MissionRenderer.ts     Three.js scene lifecycle and chapter renderer
  scene/models.ts              Reusable vehicles, terrain, astronauts, effects, and assets
  styles.css                   Portrait, landscape, safe-area, and accessibility layouts
public/
  assets/                      Compressed textures and archival references
  draco/                       Draco decoder used by the optional NASA model
  manifest.webmanifest         Installable PWA metadata
  sw.js                        Offline shell and runtime asset caching
preview/                       Mobile QA screenshots
 tests/browser/                Production-build browser smoke tests
```

### Scene streaming

The experience looks continuous but does not keep the entire mission in one 3D scene. `MissionRenderer` disposes the previous chapter bundle, constructs the selected chapter, restores the camera, and continues from the shared mission clock. This reduces active geometry and texture pressure on mobile devices.

### Deterministic timeline

Historical flight events are driven by mission elapsed time rather than an unconstrained physics simulation. Vehicle transforms and effects are reconstructed or illustrated from documented milestones, while secondary effects such as exhaust, dust, stars, and plasma remain procedural.

### Scale handling

The Earth–Moon overview offers:

- **True relative scale:** proportional Earth, Moon, and separation, with a visible trajectory locator
- **Educational compression:** a readable representation that enlarges the mission path and vehicles

Vehicle, orbital, landing-site, and surface chapters switch to appropriate local frames so centimeter-to-kilometer details remain stable in WebGL.

### NASA Lunar Module enhancement

When network access and quality settings allow, landing-related chapters dynamically load NASA’s public Apollo Lunar Module model from the official `nasa/NASA-3D-Resources` repository. The loader and Draco decoder are code-split so they do not increase the initial onboarding bundle. A detailed procedural Lunar Module is always included and remains the automatic offline, Battery-mode, and loading-failure fallback.

## Quality modes

- **High:** highest render scale and full optional model detail
- **Balanced:** mobile default, capped pixel ratio, full chapter content
- **Battery:** lower render scale, disabled dynamic shadows, procedural model fallback, and reduced update rate

The runtime can lower the active tier after sustained poor frame rate. It does not remove chapter content or historical information.

## Accessibility and recovery

The application automatically enters Accessible Story when WebGL cannot initialize or the graphics context is lost. Users can also enter it manually from Settings.

Accessible Story includes:

- All fourteen chapters
- Mission objectives and detailed explanations
- Chapter time ranges
- Mission data
- Communications and guidance text
- Inspectable system lists
- Archival references
- Primary-source links

Reduced Motion replaces long camera interpolation with immediate framing. Audio is optional and all meaningful chapter information is available as text.

## Browser QA

The included tests use Chromium, Puppeteer, and SwiftShader to exercise the built application at iPhone-shaped viewports. On Linux with Chromium and Xvfb installed:

```bash
npm run build
npm run qa:mobile
npm run qa:fallback
npm run qa:chapter -- 8
```

`qa:mobile` validates onboarding, the 3D canvas, chapter selection, the bottom sheet, source display, archival comparison, engineering mode, quality controls, Accessible Story, true scale, and portrait-to-landscape reflow.

`qa:fallback` disables WebGL and verifies automatic recovery into Accessible Story.

`qa:chapter -- <0-13>` renders an individual chapter near its final state and checks for runtime errors, unexpected fallback, and horizontal overflow. Run chapters individually when using software-rendered CI environments because repeated SwiftShader contexts can exhaust or destabilize constrained runners.

See `QA_REPORT.md` for the final validation summary and known boundaries.

## Historical approach

The application labels each chapter as one of:

- **Measured** — based directly on recorded coordinates, imagery, or telemetry
- **Documented** — stated in primary mission records
- **Reconstructed** — assembled from mission chronology, engineering references, and known behavior
- **Illustrative** — intentionally simplified to explain scale or process

The experience is an educational reconstruction, not a flight-certified simulator. Primary references are linked inside each chapter’s Sources tab.

## One-click GitHub Pages deployment

A production GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`. Push the repository to `main`, select **GitHub Actions** as the Pages source, and the site will build and publish automatically. See `DEPLOYMENT.md` for the exact steps and iPhone Home Screen installation.

## Deployment

See `DEPLOYMENT.md` for static-host, subdirectory, cache, and iOS Home Screen instructions.

## Rights and attribution

Application code is provided under the MIT License. NASA imagery, documentation, and the optional NASA 3D model are not relicensed by this repository. See `THIRD_PARTY_NOTICES.md`.
