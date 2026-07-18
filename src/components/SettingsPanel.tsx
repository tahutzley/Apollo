import { Accessibility, Battery, Gauge, MonitorUp, Smartphone, Volume2, X } from 'lucide-react';
import type { RenderStats } from '../scene/MissionRenderer';

interface SettingsPanelProps {
  quality: 'HIGH' | 'BALANCED' | 'BATTERY';
  reducedMotion: boolean;
  soundEnabled: boolean;
  stats: RenderStats;
  onQuality: (quality: 'HIGH' | 'BALANCED' | 'BATTERY') => void;
  onReducedMotion: (value: boolean) => void;
  onSound: () => void;
  onAccessible: () => void;
  onFullscreen: () => void;
  onClose: () => void;
}

export function SettingsPanel({ quality, reducedMotion, soundEnabled, stats, onQuality, onReducedMotion, onSound, onAccessible, onFullscreen, onClose }: SettingsPanelProps) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Experience settings">
      <button className="modal-scrim" onClick={onClose} aria-label="Close settings" />
      <section className="settings-panel">
        <header><div><span>EXPERIENCE CONTROL</span><h2>Settings</h2></div><button className="icon-button" onClick={onClose}><X size={19} /></button></header>

        <div className="settings-section">
          <label><Gauge size={17} /><span><strong>Rendering quality</strong><small>Adaptive quality can step down automatically.</small></span></label>
          <div className="quality-options">
            <button className={quality === 'HIGH' ? 'active' : ''} onClick={() => onQuality('HIGH')}><MonitorUp size={17} /><span>High<small>Best detail</small></span></button>
            <button className={quality === 'BALANCED' ? 'active' : ''} onClick={() => onQuality('BALANCED')}><Smartphone size={17} /><span>Balanced<small>Recommended</small></span></button>
            <button className={quality === 'BATTERY' ? 'active' : ''} onClick={() => onQuality('BATTERY')}><Battery size={17} /><span>Battery<small>Cooler device</small></span></button>
          </div>
        </div>

        <div className="settings-section settings-toggles">
          <button onClick={() => onReducedMotion(!reducedMotion)}><Accessibility size={18} /><span><strong>Reduced camera motion</strong><small>Use shorter transitions and steadier views.</small></span><i className={reducedMotion ? 'on' : ''} /></button>
          <button onClick={onSound}><Volume2 size={18} /><span><strong>Procedural soundscape</strong><small>Generated ambience; no archival recording is bundled.</small></span><i className={soundEnabled ? 'on' : ''} /></button>
        </div>

        <div className="settings-section compact-actions">
          <button onClick={onAccessible}><Accessibility size={18} />Open accessible story</button>
          <button onClick={onFullscreen}><MonitorUp size={18} />Enter fullscreen</button>
        </div>

        <div className="runtime-stats">
          <span><small>Renderer</small><strong>{stats.renderer}</strong></span>
          <span><small>FPS</small><strong>{Math.round(stats.fps)}</strong></span>
          <span><small>Draw calls</small><strong>{stats.drawCalls}</strong></span>
          <span><small>Triangles</small><strong>{Math.round(stats.triangles / 1000)}k</strong></span>
        </div>
      </section>
    </div>
  );
}
