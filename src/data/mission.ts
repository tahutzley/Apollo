export type AccuracyLevel = 'MEASURED' | 'DOCUMENTED' | 'RECONSTRUCTED' | 'ILLUSTRATIVE';

export interface ArchiveFrame {
  src: string;
  alt: string;
  title: string;
  caption: string;
  credit: string;
  aligned?: boolean;
}

export interface SourceLink {
  label: string;
  url: string;
  note: string;
}

export interface TelemetryPoint {
  label: string;
  from: number;
  to: number;
  unit: string;
  decimals?: number;
}

export interface TranscriptLine {
  at: number;
  speaker: string;
  text: string;
}

export interface MissionChapter {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  objective: string;
  description: string;
  detail: string;
  visualDuration: number;
  metStart: number;
  metEnd: number;
  accuracy: AccuracyLevel;
  telemetry: TelemetryPoint[];
  transcript: TranscriptLine[];
  sources: SourceLink[];
  archiveFrames?: ArchiveFrame[];
  inspectables: string[];
}

const nasaMission = 'https://www.nasa.gov/mission/apollo-11/';
const nasaOverview = 'https://www.nasa.gov/history/apollo-11-mission-overview/';
const nasaJournal = 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.html';
const nasaLanding = 'https://science.nasa.gov/resource/apollo-11-landing-site/';
const nasaProgram = 'https://www.nasa.gov/the-apollo-program/';
const nasaLog = 'https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/apollo11_log/log.htm';
const nasaSvs = 'https://svs.gsfc.nasa.gov/4185/';

export const chapters: MissionChapter[] = [
  {
    id: 'scale',
    number: '00',
    title: 'The Distance',
    eyebrow: 'Earth–Moon System',
    objective: 'Understand the scale before following the flight.',
    description: 'Earth and Moon are presented in a navigable scale model, with Apollo 11 marked along the route that connects them.',
    detail: 'True astronomical scale makes the spacecraft invisible. The experience therefore keeps the bodies proportionally correct while using a locator beacon and an optional educational compression. Every change in scale is labeled.',
    visualDuration: 30,
    metStart: -10800,
    metEnd: 0,
    accuracy: 'ILLUSTRATIVE',
    telemetry: [
      { label: 'Earth–Moon distance', from: 384400, to: 384400, unit: ' km', decimals: 0 },
      { label: 'Mission status', from: 0, to: 0, unit: ' PRELAUNCH', decimals: 0 },
      { label: 'Crew', from: 3, to: 3, unit: ' astronauts', decimals: 0 }
    ],
    transcript: [
      { at: 0.2, speaker: 'GUIDE', text: 'Begin at the scale of the whole journey.' },
      { at: 0.62, speaker: 'GUIDE', text: 'The Moon is not directly above the launch pad. Apollo must enter orbit, depart at the right moment, and meet a moving target.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission', url: nasaMission, note: 'Mission overview, crew, launch and splashdown dates.' },
      { label: 'NASA Apollo program', url: nasaProgram, note: 'Apollo spacecraft architecture and lunar-orbit rendezvous context.' }
    ],
    inspectables: ['Earth', 'Moon', 'Apollo trajectory', 'Scale lens']
  },
  {
    id: 'launch',
    number: '01',
    title: 'Launch Complex 39A',
    eyebrow: 'July 16, 1969',
    objective: 'Lift 2,900 metric tons of launch vehicle away from Earth.',
    description: 'Saturn V stands on Pad 39A as the final countdown moves through ignition, hold-down release, and tower clearance.',
    detail: 'The scene emphasizes scale, staged propulsion, umbilical connections, venting, and the controlled sequence that turns a stationary launch vehicle into a guided spacecraft.',
    visualDuration: 48,
    metStart: -180,
    metEnd: 150,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Altitude', from: 0, to: 15, unit: ' km', decimals: 1 },
      { label: 'Velocity', from: 0, to: 2100, unit: ' km/h', decimals: 0 },
      { label: 'Thrust', from: 0, to: 7.5, unit: 'M lbf', decimals: 1 }
    ],
    transcript: [
      { at: 0.08, speaker: 'LAUNCH CONTROL', text: 'T minus 60 seconds and counting.' },
      { at: 0.42, speaker: 'LAUNCH CONTROL', text: 'Ignition sequence start.' },
      { at: 0.54, speaker: 'LAUNCH CONTROL', text: 'All engines running. Liftoff.' },
      { at: 0.68, speaker: 'ARMSTRONG', text: 'Tower cleared.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission log', url: nasaLog, note: 'Launch sequence and milestone chronology.' },
      { label: 'NASA mission overview', url: nasaOverview, note: 'Mission objective and launch context.' }
    ],
    archiveFrames: [
      {
        src: './assets/archive-launch.webp',
        alt: 'Apollo 11 Saturn V lifting off from Launch Complex 39A',
        title: 'Apollo 11 liftoff',
        caption: 'Archival reference for the launch-pad lighting, vehicle plume, and camera language used in this reconstruction.',
        credit: 'NASA',
        aligned: false
      }
    ],
    inspectables: ['Saturn V', 'F-1 engine cluster', 'Launch umbilical tower', 'Command Module', 'Flame trench']
  },
  {
    id: 'ascent',
    number: '02',
    title: 'Staging to Orbit',
    eyebrow: 'Powered Ascent',
    objective: 'Accelerate through three stages and establish Earth parking orbit.',
    description: 'The Saturn V discards empty stages as the spacecraft climbs through the atmosphere and reaches orbital velocity.',
    detail: 'Stage events are modeled as deterministic mission states. Discarded hardware continues on simplified ballistic paths rather than disappearing.',
    visualDuration: 44,
    metStart: 150,
    metEnd: 709,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Altitude', from: 15, to: 185, unit: ' km', decimals: 0 },
      { label: 'Velocity', from: 2100, to: 27800, unit: ' km/h', decimals: 0 },
      { label: 'Active stage', from: 1, to: 3, unit: '', decimals: 0 }
    ],
    transcript: [
      { at: 0.18, speaker: 'GUIDE', text: 'The first stage has one job: escape the dense lower atmosphere with enormous thrust.' },
      { at: 0.48, speaker: 'GUIDE', text: 'The lighter second stage continues acceleration after the first stage is released.' },
      { at: 0.76, speaker: 'GUIDE', text: 'The third stage completes insertion into a temporary orbit around Earth.' }
    ],
    sources: [
      { label: 'NASA Apollo program', url: nasaProgram, note: 'Saturn V and Apollo spacecraft configuration.' },
      { label: 'NASA Apollo 11 mission log', url: nasaLog, note: 'Ascent and orbital insertion sequence.' }
    ],
    inspectables: ['S-IC first stage', 'S-II second stage', 'S-IVB third stage', 'Interstage', 'Instrument Unit']
  },
  {
    id: 'earth-orbit',
    number: '03',
    title: 'Earth Parking Orbit',
    eyebrow: 'Systems Check',
    objective: 'Verify the spacecraft before committing to the Moon.',
    description: 'Apollo 11 circles Earth while guidance, navigation, communications, and propulsion systems are checked.',
    detail: 'The orbital view can switch among inertial, Earth-fixed, and spacecraft-follow cameras. The path is deliberately enlarged for legibility while the scale mode remains labeled.',
    visualDuration: 34,
    metStart: 709,
    metEnd: 10213,
    accuracy: 'ILLUSTRATIVE',
    telemetry: [
      { label: 'Altitude', from: 185, to: 190, unit: ' km', decimals: 0 },
      { label: 'Velocity', from: 27800, to: 27800, unit: ' km/h', decimals: 0 },
      { label: 'Orbits', from: 0.2, to: 1.5, unit: '', decimals: 1 }
    ],
    transcript: [
      { at: 0.25, speaker: 'GUIDE', text: 'Parking orbit is a checkpoint, not the destination.' },
      { at: 0.7, speaker: 'GUIDE', text: 'At the departure point, the third stage will restart and turn a closed orbit into a Moon-bound trajectory.' }
    ],
    sources: [
      { label: 'NASA history: one giant leap', url: 'https://www.nasa.gov/history/july-20-1969-one-giant-leap-for-mankind/', note: 'Earth orbit and translunar injection overview.' },
      { label: 'NASA mission log', url: nasaLog, note: 'Launch-day chronology.' }
    ],
    inspectables: ['Earth parking orbit', 'Day-night terminator', 'Tracking geometry', 'S-IVB and spacecraft stack']
  },
  {
    id: 'tli',
    number: '04',
    title: 'Translunar Injection',
    eyebrow: 'Departing Earth',
    objective: 'Raise the orbit into a trajectory that intercepts the Moon.',
    description: 'The S-IVB restarts. Apollo accelerates out of Earth orbit toward the point where the Moon will arrive days later.',
    detail: 'The trajectory is shown in both inertial and simplified diagram views. The visual makes clear that the spacecraft aims for a future lunar position rather than the Moon’s apparent location at departure.',
    visualDuration: 38,
    metStart: 10213,
    metEnd: 11723,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Velocity', from: 27800, to: 38900, unit: ' km/h', decimals: 0 },
      { label: 'Distance from Earth', from: 190, to: 8000, unit: ' km', decimals: 0 },
      { label: 'Engine', from: 0, to: 1, unit: ' S-IVB', decimals: 0 }
    ],
    transcript: [
      { at: 0.24, speaker: 'GUIDE', text: 'The third stage ignites for the second time.' },
      { at: 0.58, speaker: 'GUIDE', text: 'The trajectory opens. Apollo is no longer circling Earth.' },
      { at: 0.86, speaker: 'GUIDE', text: 'The spacecraft now coasts upward against Earth’s gravity.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 overview', url: nasaOverview, note: 'Mission sequence from Earth orbit toward the Moon.' },
      { label: 'NASA mission log', url: nasaLog, note: 'Translunar injection chronology.' }
    ],
    inspectables: ['S-IVB engine', 'Outbound trajectory', 'Future Moon position', 'Velocity vector']
  },
  {
    id: 'docking',
    number: '05',
    title: 'Docking and Extraction',
    eyebrow: 'Reconfiguring the Spacecraft',
    objective: 'Retrieve Eagle from the spacecraft adapter.',
    description: 'Columbia separates, turns around, docks with Eagle, and pulls the Lunar Module free from the S-IVB.',
    detail: 'Relative speed is intentionally slow. Users can inspect the probe, drogue, capture alignment, adapter panels, reaction-control thrusters, and hard-docking sequence.',
    visualDuration: 42,
    metStart: 11723,
    metEnd: 15423,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Relative range', from: 30, to: 0, unit: ' m', decimals: 1 },
      { label: 'Closure rate', from: 0.4, to: 0.02, unit: ' m/s', decimals: 2 },
      { label: 'Docking angle', from: 180, to: 0, unit: '°', decimals: 0 }
    ],
    transcript: [
      { at: 0.16, speaker: 'GUIDE', text: 'Columbia separates from the third stage.' },
      { at: 0.44, speaker: 'GUIDE', text: 'The Command and Service Module rotates to face Eagle.' },
      { at: 0.72, speaker: 'GUIDE', text: 'Soft capture aligns the vehicles before the structural latches close.' },
      { at: 0.9, speaker: 'GUIDE', text: 'The combined spacecraft pulls free and continues toward the Moon.' }
    ],
    sources: [
      { label: 'NASA Apollo program', url: nasaProgram, note: 'Command, Service, and Lunar Module architecture.' },
      { label: 'Apollo Flight Journal gateway', url: 'https://www.nasa.gov/history/alsj-and-afj/', note: 'Flight-phase transcripts and supporting material.' }
    ],
    inspectables: ['Docking probe', 'Drogue', 'Columbia', 'Eagle', 'Spacecraft-LM adapter']
  },
  {
    id: 'coast',
    number: '06',
    title: 'Translunar Coast',
    eyebrow: 'Three Days Outbound',
    objective: 'Navigate, conserve resources, and arrive at the Moon on the correct path.',
    description: 'Earth shrinks behind the rotating spacecraft as the Moon grows ahead. Time warp compresses quiet hours without skipping meaningful events.',
    detail: 'Passive thermal control slowly rotates the spacecraft to distribute sunlight. The reconstruction uses a curated sequence of navigation, crew activity, television, and midcourse-correction moments.',
    visualDuration: 42,
    metStart: 15423,
    metEnd: 273352,
    accuracy: 'ILLUSTRATIVE',
    telemetry: [
      { label: 'Distance from Earth', from: 8000, to: 360000, unit: ' km', decimals: 0 },
      { label: 'Velocity', from: 37000, to: 5700, unit: ' km/h', decimals: 0 },
      { label: 'Time warp', from: 1, to: 1000, unit: '×', decimals: 0 }
    ],
    transcript: [
      { at: 0.18, speaker: 'GUIDE', text: 'The spacecraft slowly rolls in passive thermal control.' },
      { at: 0.48, speaker: 'GUIDE', text: 'Navigation sightings and tracking data refine the arrival path.' },
      { at: 0.82, speaker: 'GUIDE', text: 'The Moon’s gravity increasingly shapes the final approach.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission', url: nasaMission, note: 'Mission duration and major phases.' },
      { label: 'Apollo Flight Journal gateway', url: 'https://www.nasa.gov/history/alsj-and-afj/', note: 'Flight chronology and annotated transcripts.' }
    ],
    inspectables: ['Passive thermal-control roll', 'Earth', 'Moon', 'Combined CSM-LM', 'Navigation sight line']
  },
  {
    id: 'lunar-orbit',
    number: '07',
    title: 'Lunar Orbit',
    eyebrow: 'Arrival and Separation',
    objective: 'Enter lunar orbit and prepare Eagle for descent.',
    description: 'Apollo passes behind the Moon, burns into orbit, and repeatedly crosses above the planned landing region in Mare Tranquillitatis.',
    detail: 'The view highlights loss of signal behind the Moon, lunar-orbit insertion, the landing ellipse, crew transfer, and the separation of Eagle from Columbia.',
    visualDuration: 45,
    metStart: 273352,
    metEnd: 369185,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Lunar altitude', from: 110, to: 15, unit: ' km', decimals: 0 },
      { label: 'Orbital velocity', from: 5900, to: 5900, unit: ' km/h', decimals: 0 },
      { label: 'Signal', from: 1, to: 0, unit: '', decimals: 0 }
    ],
    transcript: [
      { at: 0.16, speaker: 'GUIDE', text: 'Earth drops below the lunar horizon and radio contact ends.' },
      { at: 0.42, speaker: 'GUIDE', text: 'The Service Propulsion System slows Apollo into lunar orbit.' },
      { at: 0.72, speaker: 'GUIDE', text: 'Armstrong and Aldrin enter Eagle. Collins remains in Columbia.' },
      { at: 0.9, speaker: 'GUIDE', text: 'The two spacecraft separate above the Moon.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission overview', url: nasaOverview, note: 'Lunar orbit and crew roles.' },
      { label: 'NASA Apollo journals', url: 'https://www.nasa.gov/history/alsj-and-afj/', note: 'Detailed flight and surface chronology.' }
    ],
    archiveFrames: [
      {
        src: './assets/archive-lunar-orbit.webp',
        alt: 'Apollo Lunar Module ascent stage photographed above the Moon',
        title: 'Eagle above the lunar surface',
        caption: 'An archival reference for the Lunar Module silhouette, foil surfaces, and lighting in lunar orbit.',
        credit: 'NASA',
        aligned: false
      }
    ],
    inspectables: ['Lunar orbit', 'Landing ellipse', 'Columbia', 'Eagle', 'Mare Tranquillitatis']
  },
  {
    id: 'descent',
    number: '08',
    title: 'Powered Descent',
    eyebrow: 'Eagle to Tranquility Base',
    objective: 'Cancel orbital velocity, avoid hazards, and land with limited fuel.',
    description: 'Eagle pitches from a braking attitude into the approach phase, passes over rough terrain, and moves downrange to a safer landing area.',
    detail: 'The final descent combines an external reconstruction, a simplified forward-window view, planned and actual paths, guidance phases, program-alarm context, fuel indication, and restrained dust effects.',
    visualDuration: 62,
    metStart: 369185,
    metEnd: 369943,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Altitude', from: 15200, to: 0, unit: ' m', decimals: 0 },
      { label: 'Horizontal speed', from: 1670, to: 0, unit: ' m/s', decimals: 0 },
      { label: 'Vertical speed', from: -15, to: 0, unit: ' m/s', decimals: 1 },
      { label: 'Fuel estimate', from: 100, to: 5, unit: '%', decimals: 0 }
    ],
    transcript: [
      { at: 0.12, speaker: 'GUIDE', text: 'Powered descent begins while Eagle is still moving rapidly across the surface.' },
      { at: 0.36, speaker: 'ALDRIN', text: 'Program alarm.' },
      { at: 0.48, speaker: 'MISSION CONTROL', text: 'We’re go on that alarm.' },
      { at: 0.68, speaker: 'GUIDE', text: 'Armstrong flies farther downrange to avoid rough terrain.' },
      { at: 0.88, speaker: 'ALDRIN', text: 'Contact light.' },
      { at: 0.94, speaker: 'ARMSTRONG', text: 'Tranquility Base here. The Eagle has landed.' }
    ],
    sources: [
      { label: 'Apollo 11 Lunar Surface Journal', url: nasaJournal, note: 'Landing transcript, commentary, and mission sequence.' },
      { label: 'NASA Apollo 11 landing site', url: nasaLanding, note: 'LRO view of the landing site and surviving hardware.' },
      { label: 'NASA 3D landing-site visualization', url: nasaSvs, note: 'LROC imagery and stereo terrain reconstruction.' }
    ],
    archiveFrames: [
      {
        src: './assets/archive-lro-labeled.jpg',
        alt: 'Lunar Reconnaissance Orbiter image labeling the Apollo 11 landing site hardware and tracks',
        title: 'Tranquility Base from lunar orbit',
        caption: 'A later orbital view identifying the descent stage and surface activity area. It is a geographic reference, not a frame-matched descent photograph.',
        credit: 'NASA / LRO',
        aligned: false
      }
    ],
    inspectables: ['Eagle descent stage', 'Descent engine', 'Landing radar', 'Planned path', 'Actual path', 'West Crater']
  },
  {
    id: 'eva',
    number: '09',
    title: 'One Small Step',
    eyebrow: 'Tranquility Base EVA',
    objective: 'Explore, document, collect samples, and deploy experiments.',
    description: 'The cabin opens onto a silent landscape. Armstrong and Aldrin descend, move across the site, photograph equipment, collect samples, and deploy experiments.',
    detail: 'Tap-to-move points visit Eagle, the flag, television camera, passive seismometer, laser retroreflector, sample areas, and the direction of Little West Crater. Surface microdetail is illustrative; major equipment placement is documentary.',
    visualDuration: 66,
    metStart: 369943,
    metEnd: 447720,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Surface stay', from: 0, to: 21.6, unit: ' h', decimals: 1 },
      { label: 'EVA duration', from: 0, to: 2.5, unit: ' h', decimals: 1 },
      { label: 'Distance explored', from: 0, to: 250, unit: ' m', decimals: 0 }
    ],
    transcript: [
      { at: 0.14, speaker: 'ARMSTRONG', text: 'I’m going to step off the LM now.' },
      { at: 0.2, speaker: 'ARMSTRONG', text: 'That’s one small step for a man, one giant leap for mankind.' },
      { at: 0.52, speaker: 'GUIDE', text: 'The crew deploys scientific instruments and collects documented samples.' },
      { at: 0.82, speaker: 'GUIDE', text: 'The site remains visible today in orbital imagery through its hardware and paths.' }
    ],
    sources: [
      { label: 'Apollo 11 Lunar Surface Journal', url: nasaJournal, note: 'Annotated surface chronology, imagery, and transcripts.' },
      { label: 'NASA LRO landing site', url: nasaLanding, note: 'Orbital image of the descent stage, equipment, and tracks.' },
      { label: 'NASA 3D landing-site visualization', url: nasaSvs, note: 'Terrain and site visualization reference.' }
    ],
    archiveFrames: [
      {
        src: './assets/archive-eva.webp',
        alt: 'Buzz Aldrin standing on the lunar surface near the Lunar Module',
        title: 'Aldrin at Tranquility Base',
        caption: 'Reference for suit materials, shadows, horizon contrast, and surface composition.',
        credit: 'NASA',
        aligned: false
      },
      {
        src: './assets/archive-ladder.webp',
        alt: 'Buzz Aldrin descending the Lunar Module ladder',
        title: 'Descending Eagle’s ladder',
        caption: 'Reference for the landing-leg geometry, ladder scale, and astronaut position.',
        credit: 'NASA',
        aligned: false
      },
      {
        src: './assets/archive-lro-labeled.jpg',
        alt: 'LRO image labeling the Apollo 11 descent stage and astronaut tracks',
        title: 'Surface activity from above',
        caption: 'The orbital view provides a map-scale cross-check for the explorable surface area.',
        credit: 'NASA / LRO',
        aligned: false
      }
    ],
    inspectables: ['Eagle', 'Flag assembly', 'TV camera', 'Passive seismometer', 'Laser retroreflector', 'Sample area', 'Astronaut path']
  },
  {
    id: 'ascent-rendezvous',
    number: '10',
    title: 'Return to Columbia',
    eyebrow: 'Lunar Ascent and Rendezvous',
    objective: 'Launch from the Moon and reunite the crew in lunar orbit.',
    description: 'Eagle’s ascent stage leaves the descent stage at Tranquility Base, enters lunar orbit, phases with Columbia, and docks.',
    detail: 'The ascent path is shown in a local surface frame before transitioning to a Moon-centered orbital view. Rendezvous geometry is compressed for clarity and explicitly labeled.',
    visualDuration: 48,
    metStart: 447720,
    metEnd: 487422,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Altitude', from: 0, to: 110, unit: ' km', decimals: 0 },
      { label: 'Orbital speed', from: 0, to: 5900, unit: ' km/h', decimals: 0 },
      { label: 'Range to Columbia', from: 110, to: 0, unit: ' km', decimals: 1 }
    ],
    transcript: [
      { at: 0.16, speaker: 'GUIDE', text: 'The ascent stage ignites. The descent stage remains at Tranquility Base.' },
      { at: 0.5, speaker: 'GUIDE', text: 'A sequence of orbital maneuvers brings Eagle toward Columbia.' },
      { at: 0.8, speaker: 'GUIDE', text: 'The crews dock, transfer samples, and prepare the Lunar Module for jettison.' }
    ],
    sources: [
      { label: 'Apollo 11 Lunar Surface Journal', url: nasaJournal, note: 'Return-to-orbit chronology.' },
      { label: 'NASA Apollo 11 overview', url: nasaOverview, note: 'Rendezvous and mission return sequence.' }
    ],
    archiveFrames: [
      {
        src: './assets/archive-lunar-orbit.webp',
        alt: 'Apollo Lunar Module ascent stage in lunar orbit',
        title: 'Ascent stage in lunar orbit',
        caption: 'Reference for the spacecraft configuration used during rendezvous with Columbia.',
        credit: 'NASA',
        aligned: false
      }
    ],
    inspectables: ['Ascent stage', 'Descent stage', 'Columbia', 'Rendezvous path', 'Docking system']
  },
  {
    id: 'return',
    number: '11',
    title: 'Homeward',
    eyebrow: 'Trans-Earth Coast',
    objective: 'Leave lunar orbit and target Earth’s atmosphere.',
    description: 'The Service Module engine sends Columbia home. The Moon recedes while Earth grows from a bright point into a world filling the window.',
    detail: 'The chapter compresses the multi-day return around navigation, midcourse refinement, crew rest, and preparation for entry.',
    visualDuration: 42,
    metStart: 487422,
    metEnd: 700800,
    accuracy: 'ILLUSTRATIVE',
    telemetry: [
      { label: 'Distance to Earth', from: 360000, to: 12000, unit: ' km', decimals: 0 },
      { label: 'Velocity', from: 5700, to: 39000, unit: ' km/h', decimals: 0 },
      { label: 'Crew', from: 3, to: 3, unit: ' aboard', decimals: 0 }
    ],
    transcript: [
      { at: 0.2, speaker: 'GUIDE', text: 'A Service Module burn opens the lunar orbit into a path toward Earth.' },
      { at: 0.56, speaker: 'GUIDE', text: 'The return corridor must meet the atmosphere at the correct angle.' },
      { at: 0.84, speaker: 'GUIDE', text: 'Before entry, Columbia will discard the Service Module and continue alone.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission', url: nasaMission, note: 'Return and splashdown dates.' },
      { label: 'Apollo Flight Journal gateway', url: 'https://www.nasa.gov/history/alsj-and-afj/', note: 'Return-flight chronology.' }
    ],
    inspectables: ['Columbia', 'Service Module engine', 'Earth return corridor', 'Moon', 'Entry orientation']
  },
  {
    id: 'reentry',
    number: '12',
    title: 'Reentry and Splashdown',
    eyebrow: 'July 24, 1969',
    objective: 'Survive atmospheric entry and recover the crew in the Pacific.',
    description: 'The Service Module separates. Columbia meets the atmosphere behind its heat shield, crosses a communications blackout, deploys parachutes, and splashes down.',
    detail: 'Plasma is represented with layered animated materials rather than a heavy fluid simulation. The final scene follows drogue and main parachute deployment into a calm recovery tableau.',
    visualDuration: 54,
    metStart: 700800,
    metEnd: 703115,
    accuracy: 'RECONSTRUCTED',
    telemetry: [
      { label: 'Altitude', from: 120, to: 0, unit: ' km', decimals: 0 },
      { label: 'Velocity', from: 39000, to: 35, unit: ' km/h', decimals: 0 },
      { label: 'Deceleration', from: 0.1, to: 6.5, unit: ' g', decimals: 1 }
    ],
    transcript: [
      { at: 0.18, speaker: 'GUIDE', text: 'Columbia turns its heat shield into the atmosphere.' },
      { at: 0.44, speaker: 'GUIDE', text: 'Ionized gas surrounds the capsule and interrupts radio communication.' },
      { at: 0.68, speaker: 'GUIDE', text: 'Drogue parachutes stabilize the capsule before the three main canopies open.' },
      { at: 0.9, speaker: 'GUIDE', text: 'Apollo 11 returns all three astronauts safely to Earth.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission', url: nasaMission, note: 'Splashdown date and mission summary.' },
      { label: 'NASA Apollo 11 overview', url: nasaOverview, note: 'Return and recovery context.' }
    ],
    inspectables: ['Command Module', 'Heat shield', 'Plasma sheath', 'Drogue parachutes', 'Main parachutes', 'Recovery forces']
  },
  {
    id: 'epilogue',
    number: '13',
    title: 'The Complete Journey',
    eyebrow: 'Mission Accomplished',
    objective: 'Review the route, hardware, people, and evidence left behind.',
    description: 'The camera returns to the Earth–Moon system. The entire route appears as one continuous line, linking launch, lunar orbit, Tranquility Base, and splashdown.',
    detail: 'The epilogue opens the Engineering Atlas, chapter replay, source archive, and Accessible Story. It distinguishes the hardware that returned, the descent stage and experiments left on the Moon, and the reconstructed elements of the experience.',
    visualDuration: 36,
    metStart: 703115,
    metEnd: 703115,
    accuracy: 'DOCUMENTED',
    telemetry: [
      { label: 'Mission duration', from: 195.31, to: 195.31, unit: ' h', decimals: 2 },
      { label: 'Crew returned', from: 3, to: 3, unit: '', decimals: 0 },
      { label: 'Lunar landing', from: 1, to: 1, unit: ' completed', decimals: 0 }
    ],
    transcript: [
      { at: 0.18, speaker: 'GUIDE', text: 'One launch connected two worlds and returned three people home.' },
      { at: 0.55, speaker: 'GUIDE', text: 'The descent stage, instruments, and surface paths remain at Tranquility Base.' },
      { at: 0.82, speaker: 'GUIDE', text: 'Open any chapter, inspect the spacecraft, or continue through the source archive.' }
    ],
    sources: [
      { label: 'NASA Apollo 11 mission', url: nasaMission, note: 'Official mission page.' },
      { label: 'Apollo Lunar Surface and Flight Journals', url: 'https://www.nasa.gov/history/alsj-and-afj/', note: 'Detailed historical record.' },
      { label: 'NASA LRO landing-site resource', url: nasaLanding, note: 'Modern orbital evidence at the site.' }
    ],
    archiveFrames: [
      {
        src: './assets/archive-launch.webp',
        alt: 'Apollo 11 Saturn V at liftoff',
        title: 'Departure',
        caption: 'Apollo 11 leaves Earth from Launch Complex 39A.',
        credit: 'NASA',
        aligned: false
      },
      {
        src: './assets/archive-eva.webp',
        alt: 'Buzz Aldrin on the lunar surface',
        title: 'Tranquility Base',
        caption: 'The crew works on the lunar surface during the first crewed Moon landing.',
        credit: 'NASA',
        aligned: false
      },
      {
        src: './assets/archive-lro-labeled.jpg',
        alt: 'LRO image of the Apollo 11 landing site',
        title: 'What remains',
        caption: 'Later orbital imagery identifies hardware and tracks at the landing site.',
        credit: 'NASA / LRO',
        aligned: false
      }
    ],
    inspectables: ['Complete trajectory', 'Earth', 'Moon', 'Tranquility Base', 'Splashdown region']
  }
];

export const totalVisualDuration = chapters.reduce((sum, chapter) => sum + chapter.visualDuration, 0);

export function getChapterOffset(index: number): number {
  return chapters.slice(0, index).reduce((sum, chapter) => sum + chapter.visualDuration, 0);
}

export function locateVisualTime(time: number): { chapterIndex: number; chapterProgress: number } {
  const clamped = Math.min(Math.max(time, 0), totalVisualDuration - 0.0001);
  let cursor = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    const end = cursor + chapters[i].visualDuration;
    if (clamped < end) {
      return { chapterIndex: i, chapterProgress: (clamped - cursor) / chapters[i].visualDuration };
    }
    cursor = end;
  }
  return { chapterIndex: chapters.length - 1, chapterProgress: 1 };
}

export function missionElapsedAt(chapter: MissionChapter, progress: number): number {
  return chapter.metStart + (chapter.metEnd - chapter.metStart) * progress;
}

export function formatMET(seconds: number): string {
  const sign = seconds < 0 ? 'T−' : 'T+';
  const abs = Math.max(0, Math.round(Math.abs(seconds)));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${sign}${String(h).padStart(3, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
