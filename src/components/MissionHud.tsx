import { Box, Gauge, Menu, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { MissionChapter } from '../data/mission';

interface MissionHudProps {
  chapter: MissionChapter;
  met: string;
  scaleLabel: string;
  soundEnabled: boolean;
  guided: boolean;
  onMenu: () => void;
  onChapters: () => void;
  onToggleSound: () => void;
  onReturnGuided: () => void;
}

export function MissionHud({ chapter, met, scaleLabel, soundEnabled, guided, onMenu, onChapters, onToggleSound, onReturnGuided }: MissionHudProps) {
  return (
    <header className="mission-hud">
      <div className="hud-left">
        <button className="hud-icon-button" onClick={onMenu} aria-label="Open settings"><Menu size={19} /></button>
        <button className="chapter-identity" onClick={onChapters} aria-label="Choose mission chapter">
          <span>{chapter.number} · {chapter.eyebrow}</span>
          <strong>{chapter.title}</strong>
        </button>
      </div>
      <div className="hud-right">
        <div className="met-readout"><span>MISSION ELAPSED TIME</span><strong>{met}</strong></div>
        <button className="hud-icon-button hud-sound" onClick={onToggleSound} aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}>
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      <div className="scale-chip"><Gauge size={13} /><span>{scaleLabel}</span></div>
      {!guided && (
        <button className="guided-return" onClick={onReturnGuided}><RotateCcw size={15} /> Return to guided camera</button>
      )}
      <button className="atlas-shortcut" onClick={onChapters} aria-label="Open mission index"><Box size={16} /></button>
    </header>
  );
}
