import { Check, X } from 'lucide-react';
import type { MissionChapter } from '../data/mission';

interface ChapterPickerProps {
  chapters: MissionChapter[];
  currentIndex: number;
  onChoose: (index: number) => void;
  onClose: () => void;
}

export function ChapterPicker({ chapters, currentIndex, onChoose, onClose }: ChapterPickerProps) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Mission chapters">
      <button className="modal-scrim" onClick={onClose} aria-label="Close chapter picker" />
      <section className="chapter-picker">
        <header>
          <div><span>MISSION INDEX</span><h2>Choose a chapter</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <div className="chapter-list">
          {chapters.map((chapter, index) => (
            <button key={chapter.id} className={index === currentIndex ? 'current' : ''} onClick={() => onChoose(index)}>
              <span className="chapter-number">{chapter.number}</span>
              <span><strong>{chapter.title}</strong><small>{chapter.eyebrow}</small></span>
              {index === currentIndex ? <Check size={17} /> : <span className="chapter-duration">{Math.round(chapter.visualDuration)}s</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
