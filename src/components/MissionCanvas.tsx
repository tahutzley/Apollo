import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { MissionChapter } from '../data/mission';
import { MissionRenderer, type RenderStats, type SelectionInfo } from '../scene/MissionRenderer';

export interface MissionCanvasHandle {
  returnToGuided: () => void;
  isGuided: () => boolean;
}

interface MissionCanvasProps {
  chapter: MissionChapter;
  progress: number;
  active: boolean;
  quality: 'HIGH' | 'BALANCED' | 'BATTERY';
  scaleMode: 'TRUE' | 'EDUCATIONAL';
  exploded: boolean;
  reducedMotion: boolean;
  onSelect: (selection: SelectionInfo | null) => void;
  onStats: (stats: RenderStats) => void;
  onFailure: () => void;
  onFreeCamera: () => void;
}

export const MissionCanvas = forwardRef<MissionCanvasHandle, MissionCanvasProps>(function MissionCanvas({
  chapter,
  progress,
  active,
  quality,
  scaleMode,
  exploded,
  reducedMotion,
  onSelect,
  onStats,
  onFailure,
  onFreeCamera
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<MissionRenderer | null>(null);
  const progressRef = useRef(progress);
  const frameRef = useRef<number>(0);

  progressRef.current = progress;

  useImperativeHandle(ref, () => ({
    returnToGuided: () => rendererRef.current?.setGuided(true),
    isGuided: () => rendererRef.current?.isGuided() ?? true
  }), []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const renderer = new MissionRenderer(canvas, { onSelect, onStats, reducedMotion, onFreeCamera });
      rendererRef.current = renderer;
      renderer.setChapter(chapter);
      const resize = (): void => {
        const viewport = window.visualViewport;
        const rect = canvas.getBoundingClientRect();
        renderer.resize(rect.width, viewport ? Math.min(rect.height, viewport.height) : rect.height);
      };
      const observer = new ResizeObserver(resize);
      const handleContextLost = (event: Event): void => {
        event.preventDefault();
        cancelAnimationFrame(frameRef.current);
        onFailure();
      };
      observer.observe(canvas);
      window.visualViewport?.addEventListener('resize', resize);
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      resize();

      const loop = (): void => {
        renderer.render(progressRef.current);
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(frameRef.current);
        observer.disconnect();
        window.visualViewport?.removeEventListener('resize', resize);
        canvas.removeEventListener('webglcontextlost', handleContextLost, false);
        renderer.dispose();
        rendererRef.current = null;
      };
    } catch (error) {
      console.error('Unable to initialize the 3D renderer', error);
      onFailure();
      return;
    }
  // Renderer is intentionally constructed once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { rendererRef.current?.setChapter(chapter); }, [chapter]);
  useEffect(() => { rendererRef.current?.setPlaybackActive(active); }, [active]);
  useEffect(() => { rendererRef.current?.setQuality(quality); }, [quality]);
  useEffect(() => { rendererRef.current?.setScaleMode(scaleMode); }, [scaleMode]);
  useEffect(() => { rendererRef.current?.setExploded(exploded); }, [exploded]);
  useEffect(() => { rendererRef.current?.setReducedMotion(reducedMotion); }, [reducedMotion]);

  return <canvas ref={canvasRef} className="mission-canvas" aria-hidden="true" />;
});
