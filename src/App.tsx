import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Crosshair, Info, WifiOff } from 'lucide-react';
import { AccessibleStory } from './components/AccessibleStory';
import { ArchiveOverlay } from './components/ArchiveOverlay';
import { BottomSheet, type SheetTab } from './components/BottomSheet';
import { ChapterPicker } from './components/ChapterPicker';
import type { MissionCanvasHandle } from './components/MissionCanvas';
import { MissionHud } from './components/MissionHud';
import { Onboarding } from './components/Onboarding';
import { SettingsPanel } from './components/SettingsPanel';
import { TimelineControls } from './components/TimelineControls';
import { SoundEngine } from './audio/SoundEngine';
import {
  chapters,
  formatMET,
  getChapterOffset,
  locateVisualTime,
  missionElapsedAt,
  totalVisualDuration,
  type ArchiveFrame
} from './data/mission';
import type { RenderStats, SelectionInfo } from './scene/MissionRenderer';
import './styles.css';

const MissionCanvas = lazy(() =>
  import('./components/MissionCanvas').then((module) => ({ default: module.MissionCanvas }))
);

const defaultStats: RenderStats = {
  fps: 0,
  frameMs: 0,
  drawCalls: 0,
  triangles: 0,
  quality: 'BALANCED',
  renderer: 'INITIALIZING'
};


function readSessionNumber(key: string): number {
  try {
    const value = Number(window.sessionStorage.getItem(key));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeSession(key: string, value: string): void {
  try { window.sessionStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
}


function readStoredEnum<T extends string>(key: string, values: readonly T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key) as T | null;
    return value && values.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function readStoredBoolean(key: string): boolean | undefined {
  try {
    const value = window.localStorage.getItem(key);
    if (value === 'true') return true;
    if (value === 'false') return false;
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
  return undefined;
}

function writeStored(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* nonessential preference */ }
}

function chapterScaleLabel(id: string, scaleMode: 'TRUE' | 'EDUCATIONAL'): string {
  if (id === 'scale' || id === 'epilogue') return scaleMode === 'TRUE' ? 'TRUE RELATIVE SCALE' : 'EDUCATIONAL COMPRESSION';
  if (['earth-orbit', 'tli', 'coast', 'lunar-orbit', 'return', 'ascent-rendezvous'].includes(id)) return 'DISTANCE COMPRESSED · VEHICLE ENLARGED';
  if (id === 'eva') return 'HUMAN / SURFACE SCALE';
  if (id === 'descent') return 'LANDING-SITE LOCAL FRAME';
  return 'VEHICLE / LOCAL RECONSTRUCTION';
}

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const [started, setStarted] = useState(query.get('autostart') === '1');
  const [accessible, setAccessible] = useState(query.get('story') === '1');
  const [visualTime, setVisualTime] = useState(() => {
    const restored = readSessionNumber('apollo11-time');
    return Math.min(restored, totalVisualDuration - 0.001);
  });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab>('mission');
  const [chapterPicker, setChapterPicker] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [quality, setQuality] = useState<'HIGH' | 'BALANCED' | 'BATTERY'>(() => readStoredEnum('apollo11-quality', ['HIGH', 'BALANCED', 'BATTERY'] as const, 'BALANCED'));
  const [scaleMode, setScaleMode] = useState<'TRUE' | 'EDUCATIONAL'>(() => readStoredEnum('apollo11-scale', ['TRUE', 'EDUCATIONAL'] as const, 'EDUCATIONAL'));
  const [exploded, setExploded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => readStoredBoolean('apollo11-reduced-motion') ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [soundEnabled, setSoundEnabled] = useState(() => readStoredBoolean('apollo11-sound') ?? true);
  const [stats, setStats] = useState<RenderStats>(defaultStats);
  const [rendererFailed, setRendererFailed] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [guided, setGuided] = useState(true);
  const [archiveFrame, setArchiveFrame] = useState<ArchiveFrame | null>(null);
  const canvasRef = useRef<MissionCanvasHandle | null>(null);
  const soundRef = useRef<SoundEngine | null>(null);
  const lastFrameRef = useRef<number>(performance.now());
  const touchdownPlayedRef = useRef(false);

  const location = useMemo(() => locateVisualTime(visualTime), [visualTime]);
  const chapter = chapters[location.chapterIndex];
  const chapterProgress = location.chapterProgress;
  const met = formatMET(missionElapsedAt(chapter, chapterProgress));

  useEffect(() => {
    const sound = new SoundEngine();
    soundRef.current = sound;
    return () => sound.dispose();
  }, []);

  useEffect(() => {
    soundRef.current?.setEnabled(accessible || rendererFailed ? false : soundEnabled);
  }, [accessible, rendererFailed, soundEnabled]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    writeSession('apollo11-time', String(visualTime));
  }, [visualTime]);

  useEffect(() => { writeStored('apollo11-quality', quality); }, [quality]);
  useEffect(() => { writeStored('apollo11-scale', scaleMode); }, [scaleMode]);
  useEffect(() => { writeStored('apollo11-reduced-motion', String(reducedMotion)); }, [reducedMotion]);
  useEffect(() => { writeStored('apollo11-sound', String(soundEnabled)); }, [soundEnabled]);

  useEffect(() => {
    soundRef.current?.setChapter(chapter.id);
    touchdownPlayedRef.current = false;
    setSelection(null);
    setExploded(false);
    setGuided(true);
  }, [chapter.id]);

  useEffect(() => {
    if (!playing || accessible || !started) return;
    let frame = 0;
    lastFrameRef.current = performance.now();
    const tick = (now: number): void => {
      const delta = Math.min((now - lastFrameRef.current) / 1000, 0.08);
      lastFrameRef.current = now;
      setVisualTime((current) => {
        const next = current + delta * speed;
        if (next >= totalVisualDuration) {
          setPlaying(false);
          return totalVisualDuration - 0.001;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, accessible, started]);

  useEffect(() => {
    if (chapter.id === 'descent' && chapterProgress >= 0.94 && !touchdownPlayedRef.current) {
      touchdownPlayedRef.current = true;
      soundRef.current?.pulse('touchdown');
      if ('vibrate' in navigator) navigator.vibrate?.([20, 40, 30]);
    }
  }, [chapter.id, chapterProgress]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key === 'Escape') {
        setArchiveFrame(null);
        setSettingsOpen(false);
        setChapterPicker(false);
        setSheetOpen(false);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        void soundRef.current?.start();
        setPlaying((value) => !value);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPlaying(false);
        setVisualTime((value) => Math.min(totalVisualDuration - 0.001, value + 5));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPlaying(false);
        setVisualTime((value) => Math.max(0, value - 5));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  async function beginMission(): Promise<void> {
    await soundRef.current?.start();
    soundRef.current?.setEnabled(soundEnabled);
    setStarted(true);
    setPlaying(true);
  }

  function chooseChapter(index: number): void {
    setVisualTime(getChapterOffset(index) + 0.001);
    setChapterPicker(false);
    setPlaying(false);
    setSheetOpen(false);
  }

  function previousChapter(): void {
    chooseChapter(Math.max(0, location.chapterIndex - 1));
  }

  function nextChapter(): void {
    chooseChapter(Math.min(chapters.length - 1, location.chapterIndex + 1));
  }

  function restartChapter(): void {
    setVisualTime(getChapterOffset(location.chapterIndex) + 0.001);
    setPlaying(true);
  }

  async function toggleSound(): Promise<void> {
    await soundRef.current?.start();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundRef.current?.setEnabled(next);
    soundRef.current?.setChapter(chapter.id);
  }

  function cycleSpeed(): void {
    const speeds = [1, 2, 5, 10];
    const index = speeds.indexOf(speed);
    setSpeed(speeds[(index + 1) % speeds.length]);
  }

  function returnGuided(): void {
    canvasRef.current?.returnToGuided();
    setGuided(true);
  }

  function inspectFromAtlas(label: string): void {
    setSelection({ label, description: `A highlighted element in the ${chapter.title} chapter. Tap its visible 3D representation for the complete object-specific description.` });
    soundRef.current?.pulse('select');
    setSheetOpen(true);
  }

  async function enterFullscreen(): Promise<void> {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch {
      // iOS standalone mode may not expose the Fullscreen API.
    }
  }

  if (!started && !accessible) {
    return <Onboarding onBegin={beginMission} onAccessible={() => { setStarted(true); setAccessible(true); }} />;
  }

  if (accessible || rendererFailed) {
    return (
      <>
        <AccessibleStory
          chapter={chapter}
          index={location.chapterIndex}
          total={chapters.length}
          onPrevious={previousChapter}
          onNext={nextChapter}
          onChapterPicker={() => setChapterPicker(true)}
          onReturn3D={() => { setRendererFailed(false); setAccessible(false); setStarted(true); }}
        />
        {chapterPicker && <ChapterPicker chapters={chapters} currentIndex={location.chapterIndex} onChoose={chooseChapter} onClose={() => setChapterPicker(false)} />}
      </>
    );
  }

  return (
    <main className={`experience ${sheetOpen ? 'sheet-is-open' : ''}`}>
      <div className="sr-only" aria-live="polite">Chapter {chapter.number}: {chapter.title}. Mission time {met}.</div>
      <Suspense fallback={<div className="canvas-loading" role="status"><span />Preparing mission renderer…</div>}>
        <MissionCanvas
          ref={canvasRef}
          chapter={chapter}
          progress={chapterProgress}
          active={playing && !settingsOpen && !chapterPicker && !archiveFrame}
          quality={quality}
          scaleMode={scaleMode}
          exploded={exploded}
          reducedMotion={reducedMotion}
          onSelect={(value) => {
            setSelection(value);
            if (value) {
              soundRef.current?.pulse('select');
              setSheetOpen(true);
              setSheetTab('atlas');
            }
          }}
          onStats={(value) => {
            setStats(value);
            if (value.quality !== quality && quality !== 'BATTERY') setQuality(value.quality);
          }}
          onFailure={() => setRendererFailed(true)}
          onFreeCamera={() => setGuided(false)}
        />
      </Suspense>

      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="chapter-flash" key={chapter.id} aria-hidden="true" />

      <MissionHud
        chapter={chapter}
        met={met}
        scaleLabel={chapterScaleLabel(chapter.id, scaleMode)}
        soundEnabled={soundEnabled}
        guided={guided}
        onMenu={() => setSettingsOpen(true)}
        onChapters={() => setChapterPicker(true)}
        onToggleSound={toggleSound}
        onReturnGuided={returnGuided}
      />

      {!online && <div className="offline-badge"><WifiOff size={14} />Offline · cached content only</div>}

      <div className="scene-hint">
        <Crosshair size={15} />
        <span>Drag to look · pinch to zoom · tap objects to inspect</span>
      </div>

      <TimelineControls
        visualTime={visualTime}
        totalDuration={totalVisualDuration}
        playing={playing}
        speed={speed}
        chapter={chapter}
        chapterProgress={chapterProgress}
        onSeek={(value) => { setVisualTime(value); setPlaying(false); }}
        onPlayPause={async () => {
          await soundRef.current?.start();
          soundRef.current?.setChapter(chapter.id);
          setPlaying((value) => !value);
        }}
        onPrevious={previousChapter}
        onNext={nextChapter}
        onRestart={restartChapter}
        onSpeed={cycleSpeed}
      />

      <BottomSheet
        chapter={chapter}
        progress={chapterProgress}
        open={sheetOpen}
        tab={sheetTab}
        selection={selection}
        exploded={exploded}
        scaleMode={scaleMode}
        onOpenChange={setSheetOpen}
        onTab={setSheetTab}
        onClearSelection={() => setSelection(null)}
        onToggleExploded={() => setExploded((value) => !value)}
        onScaleMode={setScaleMode}
        onInspectItem={inspectFromAtlas}
        onOpenArchive={(frame) => { setArchiveFrame(frame); setPlaying(false); }}
      />

      {archiveFrame && <ArchiveOverlay frame={archiveFrame} onClose={() => setArchiveFrame(null)} />}

      {settingsOpen && (
        <SettingsPanel
          quality={quality}
          reducedMotion={reducedMotion}
          soundEnabled={soundEnabled}
          stats={stats}
          onQuality={setQuality}
          onReducedMotion={setReducedMotion}
          onSound={toggleSound}
          onAccessible={() => { setAccessible(true); setSettingsOpen(false); setPlaying(false); }}
          onFullscreen={enterFullscreen}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {chapterPicker && <ChapterPicker chapters={chapters} currentIndex={location.chapterIndex} onChoose={chooseChapter} onClose={() => setChapterPicker(false)} />}

      {stats.fps > 0 && stats.fps < 18 && quality === 'BATTERY' && (
        <div className="performance-warning"><AlertTriangle size={16} /><span>Performance is limited. Accessible Story remains available in Settings.</span></div>
      )}

      <button className="info-floating" onClick={() => { setSheetOpen(true); setSheetTab('mission'); }} aria-label="Open chapter information"><Info size={17} /></button>
    </main>
  );
}
