# Attributions and source notes

This project is an independent educational reconstruction. NASA does not endorse this application.

## NASA historical resources

The in-application source panels link directly to the primary or official resources used to establish mission structure, event chronology, equipment, surface activity, and modern landing-site context. These include:

- NASA Apollo 11 mission page and mission overview.
- Apollo 11 Mission Report.
- Apollo 11 Flight Plan.
- Apollo Flight Journal.
- Apollo Lunar Surface Journal.
- NASA Scientific Visualization Studio Apollo landing-site resources.
- Lunar Reconnaissance Orbiter landing-site imagery.

Exact page links are stored beside the relevant chapter in `src/data/mission.ts`.

## Historical imagery

The archive images distributed in `public/assets/` are NASA historical or scientific-visualization reference images, resized and converted for mobile web delivery. Each image is identified and credited inside the archive overlay or Accessible Story.

Bundled files:

- `archive-launch.webp`
- `archive-lunar-orbit.webp`
- `archive-ladder.webp`
- `archive-eva.webp`
- `archive-lro-labeled.jpg`

## Apollo Lunar Module model

Enhanced online detail is loaded from:

- Repository: `nasa/NASA-3D-Resources`
- Resource: Apollo Lunar Module GLB
- NASA resource attribution: NASA / Michael D. Carbajal

The remote model is optional. A procedurally generated Lunar Module is bundled with the application and remains visible when the enhanced model cannot load.

## Planetary textures

Bundled Earth, Moon, cloud, and procedural-noise textures are used as optimized visual references inside an illustrative real-time renderer. They should not be interpreted as time-specific Apollo 11 photography or exact time-dependent weather imagery.

## Usage

Anyone redistributing or publishing this project should review NASA's current media-usage guidance and retain visible credits and source links.
