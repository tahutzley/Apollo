import { BookOpen, ChevronDown, ChevronUp, CircleDot, ExternalLink, Gauge, Layers3, Quote, X } from 'lucide-react';
import type { ArchiveFrame, MissionChapter } from '../data/mission';
import type { SelectionInfo } from '../scene/MissionRenderer';

export type SheetTab = 'mission' | 'data' | 'transcript' | 'atlas' | 'sources';

interface BottomSheetProps {
  chapter: MissionChapter;
  progress: number;
  open: boolean;
  tab: SheetTab;
  selection: SelectionInfo | null;
  exploded: boolean;
  scaleMode: 'TRUE' | 'EDUCATIONAL';
  onOpenChange: (open: boolean) => void;
  onTab: (tab: SheetTab) => void;
  onClearSelection: () => void;
  onToggleExploded: () => void;
  onScaleMode: (mode: 'TRUE' | 'EDUCATIONAL') => void;
  onInspectItem: (label: string) => void;
  onOpenArchive: (frame: ArchiveFrame) => void;
}

function telemetryValue(from: number, to: number, progress: number, decimals = 0): string {
  return (from + (to - from) * progress).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function BottomSheet({
  chapter,
  progress,
  open,
  tab,
  selection,
  exploded,
  scaleMode,
  onOpenChange,
  onTab,
  onClearSelection,
  onToggleExploded,
  onScaleMode,
  onInspectItem,
  onOpenArchive
}: BottomSheetProps) {
  const currentTranscript = chapter.transcript.reduce((current, line) => progress >= line.at ? line : current, chapter.transcript[0]);

  return (
    <section className={`bottom-sheet ${open ? 'open' : ''}`} aria-label="Mission information">
      <button className="sheet-handle" onClick={() => onOpenChange(!open)} aria-expanded={open}>
        <span />
        <div>
          <small>{selection ? 'SELECTED OBJECT' : chapter.objective}</small>
          <strong>{selection ? selection.label : currentTranscript?.text}</strong>
        </div>
        {open ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>

      <nav className="sheet-tabs" aria-label="Information sections">
        <button className={tab === 'mission' ? 'active' : ''} onClick={() => onTab('mission')}><BookOpen size={16} /><span>Mission</span></button>
        <button className={tab === 'data' ? 'active' : ''} onClick={() => onTab('data')}><Gauge size={16} /><span>Data</span></button>
        <button className={tab === 'transcript' ? 'active' : ''} onClick={() => onTab('transcript')}><Quote size={16} /><span>Comms</span></button>
        <button className={tab === 'atlas' ? 'active' : ''} onClick={() => onTab('atlas')}><Layers3 size={16} /><span>Atlas</span></button>
        <button className={tab === 'sources' ? 'active' : ''} onClick={() => onTab('sources')}><CircleDot size={16} /><span>Sources</span></button>
      </nav>

      <div className="sheet-content">
        {selection && (
          <article className="selection-card">
            <button onClick={onClearSelection} aria-label="Clear selection"><X size={16} /></button>
            <span>3D OBJECT</span>
            <h3>{selection.label}</h3>
            <p>{selection.description}</p>
          </article>
        )}

        {tab === 'mission' && (
          <article className="mission-copy">
            <div className="copy-heading"><span className={`accuracy ${chapter.accuracy.toLowerCase()}`}>{chapter.accuracy}</span><small>CHAPTER {chapter.number}</small></div>
            <h2>{chapter.objective}</h2>
            <p className="lead">{chapter.description}</p>
            <p>{chapter.detail}</p>
          </article>
        )}

        {tab === 'data' && (
          <article>
            <div className="section-heading"><div><span>LIVE RECONSTRUCTION</span><h2>Mission data</h2></div><small>{Math.round(progress * 100)}%</small></div>
            <div className="telemetry-grid">
              {chapter.telemetry.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{telemetryValue(item.from, item.to, progress, item.decimals)}<small>{item.unit}</small></strong>
                  <div className="micro-meter"><i style={{ width: `${Math.max(4, progress * 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="data-note">Values are synchronized to the chapter’s educational timeline. Where continuous telemetry is unavailable, interpolation is labeled as reconstructed or illustrative.</p>
          </article>
        )}

        {tab === 'transcript' && (
          <article>
            <div className="section-heading"><div><span>SYNCHRONIZED GUIDE</span><h2>Communications</h2></div></div>
            <div className="transcript-list">
              {chapter.transcript.map((line) => (
                <div key={`${line.at}-${line.speaker}`} className={currentTranscript === line ? 'current' : ''}>
                  <span>{line.speaker}</span>
                  <p>{line.text}</p>
                  <small>{Math.round(line.at * 100)}%</small>
                </div>
              ))}
            </div>
          </article>
        )}

        {tab === 'atlas' && (
          <article>
            <div className="section-heading"><div><span>ENGINEERING ATLAS</span><h2>Inspect this scene</h2></div></div>
            <div className="atlas-controls">
              <button className={exploded ? 'active' : ''} onClick={onToggleExploded}><Layers3 size={17} />{exploded ? 'Collapse assembly' : 'Exploded view'}</button>
              {(chapter.id === 'scale' || chapter.id === 'epilogue') && (
                <div className="segmented">
                  <button className={scaleMode === 'TRUE' ? 'active' : ''} onClick={() => onScaleMode('TRUE')}>True scale</button>
                  <button className={scaleMode === 'EDUCATIONAL' ? 'active' : ''} onClick={() => onScaleMode('EDUCATIONAL')}>Readable</button>
                </div>
              )}
            </div>
            <div className="atlas-list">
              {chapter.inspectables.map((item, index) => (
                <button key={item} onClick={() => onInspectItem(item)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><ExternalLink size={15} /></button>
              ))}
            </div>
            <p className="data-note">Tap visible spacecraft, terrain, and equipment directly in the 3D view for object-level descriptions.</p>
          </article>
        )}

        {tab === 'sources' && (
          <article>
            <div className="section-heading"><div><span>PRIMARY REFERENCES</span><h2>Sources and confidence</h2></div><span className={`accuracy ${chapter.accuracy.toLowerCase()}`}>{chapter.accuracy}</span></div>
            <p className="source-intro">The experience separates documented facts from reconstructed motion and illustrative microdetail. Open the references below for the historical record used by this chapter.</p>
            {chapter.archiveFrames && chapter.archiveFrames.length > 0 && (
              <>
                <h3 className="archive-section-title">Archival comparison</h3>
                <div className="archive-grid">
                  {chapter.archiveFrames.map((frame) => (
                    <button className="archive-card" key={`${frame.src}-${frame.title}`} onClick={() => onOpenArchive(frame)}>
                      <img src={frame.src} alt="" loading="lazy" />
                      <span><strong>{frame.title}</strong><small>{frame.credit}</small></span>
                      <ExternalLink size={15} />
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="source-list">
              {chapter.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  <div><strong>{source.label}</strong><p>{source.note}</p></div><ExternalLink size={17} />
                </a>
              ))}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
