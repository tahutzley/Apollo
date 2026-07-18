import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { chapters, getChapterOffset, type MissionChapter } from '../data/mission';

interface TimelineControlsProps {
  visualTime: number;
  totalDuration: number;
  playing: boolean;
  speed: number;
  chapter: MissionChapter;
  chapterProgress: number;
  onSeek: (value: number) => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestart: () => void;
  onSpeed: () => void;
}

export function TimelineControls({ visualTime, totalDuration, playing, speed, chapter, chapterProgress, onSeek, onPlayPause, onPrevious, onNext, onRestart, onSpeed }: TimelineControlsProps) {
  return (
    <div className="timeline-controls">
      <div className="timeline-progress-row">
        <span>{chapter.number}</span>
        <div className="timeline-range-wrap">
          <div className="timeline-markers" aria-hidden="true">
            {chapters.slice(1).map((item, index) => (
              <i key={item.id} style={{ left: `${(getChapterOffset(index + 1) / totalDuration) * 100}%` }} />
            ))}
          </div>
          <input
            aria-label="Mission timeline"
            type="range"
            min={0}
            max={totalDuration}
            step={0.05}
            value={visualTime}
            onChange={(event) => onSeek(Number(event.target.value))}
            style={{ '--timeline-progress': `${(visualTime / totalDuration) * 100}%` } as React.CSSProperties}
          />
        </div>
        <span>{Math.round(chapterProgress * 100)}%</span>
      </div>
      <div className="playback-row">
        <button onClick={onPrevious} aria-label="Previous chapter"><SkipBack size={18} /></button>
        <button className="play-button" onClick={onPlayPause} aria-label={playing ? 'Pause mission' : 'Play mission'}>{playing ? <Pause size={21} /> : <Play size={21} />}</button>
        <button onClick={onNext} aria-label="Next chapter"><SkipForward size={18} /></button>
        <button className="speed-button" onClick={onSpeed} aria-label="Change playback speed">{speed}×</button>
        <button className="restart-button" onClick={onRestart} aria-label="Restart chapter"><RotateCcw size={16} /></button>
      </div>
    </div>
  );
}
