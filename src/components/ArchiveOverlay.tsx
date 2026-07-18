import { Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import type { ArchiveFrame } from '../data/mission';

interface ArchiveOverlayProps {
  frame: ArchiveFrame;
  onClose: () => void;
}

export function ArchiveOverlay({ frame, onClose }: ArchiveOverlayProps) {
  const [opacity, setOpacity] = useState(0.86);

  return (
    <div className="archive-overlay" role="dialog" aria-modal="true" aria-label={`Archival reference: ${frame.title}`}>
      <button className="archive-overlay-scrim" onClick={onClose} aria-label="Close archival reference" />
      <div className="archive-visual" aria-label={frame.alt}>
        <img src={frame.src} alt={frame.alt} style={{ opacity }} />
      </div>
      <section className="archive-overlay-panel">
        <header>
          <div><span>ARCHIVAL REFERENCE</span><h2>{frame.title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close archival reference"><X size={19} /></button>
        </header>
        <p>{frame.caption}</p>
        <div className="archive-opacity-control">
          <ImageIcon size={17} />
          <label htmlFor="archive-opacity">Reference opacity</label>
          <input
            id="archive-opacity"
            type="range"
            min="0.15"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
          />
          <strong>{Math.round(opacity * 100)}%</strong>
        </div>
        <footer>
          <span>{frame.credit}</span>
          <small>{frame.aligned ? 'Camera-aligned comparison' : 'Reference overlay · not camera-aligned'}</small>
        </footer>
      </section>
    </div>
  );
}
