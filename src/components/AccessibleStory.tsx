import { ArrowLeft, ArrowRight, Box, ExternalLink, Play, X } from 'lucide-react';
import type { MissionChapter } from '../data/mission';
import { formatMET } from '../data/mission';

interface AccessibleStoryProps {
  chapter: MissionChapter;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onChapterPicker: () => void;
  onReturn3D: () => void;
  onClose?: () => void;
}

export function AccessibleStory({ chapter, index, total, onPrevious, onNext, onChapterPicker, onReturn3D, onClose }: AccessibleStoryProps) {
  return (
    <main className="accessible-story">
      <header className="accessible-header">
        <button className="icon-button light" onClick={onChapterPicker} aria-label="Choose chapter"><Box size={19} /></button>
        <div>
          <span>APOLLO 11 ACCESSIBLE STORY</span>
          <strong>{index + 1} / {total}</strong>
        </div>
        {onClose ? <button className="icon-button light" onClick={onClose} aria-label="Close"><X size={19} /></button> : <span />}
      </header>

      <article className={`story-poster story-${chapter.id}`}>
        <div className="story-orbit-art" aria-hidden="true"><span /><i /><b /></div>
        <div className="story-poster-copy">
          <p>{chapter.number} · {chapter.eyebrow}</p>
          <h1>{chapter.title}</h1>
          <span>{formatMET(chapter.metStart)} — {formatMET(chapter.metEnd)}</span>
        </div>
      </article>

      <article className="story-content">
        <p className="accuracy-pill">{chapter.accuracy}</p>
        <h2>{chapter.objective}</h2>
        <p className="story-lead">{chapter.description}</p>
        <p>{chapter.detail}</p>

        <section>
          <h3>Mission data</h3>
          <div className="story-data-grid">
            {chapter.telemetry.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.to.toLocaleString(undefined, { maximumFractionDigits: item.decimals ?? 0 })}{item.unit}</strong>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>Key communications and guidance</h3>
          <div className="story-transcript">
            {chapter.transcript.map((line) => (
              <p key={`${line.speaker}-${line.at}`}><strong>{line.speaker}</strong>{line.text}</p>
            ))}
          </div>
        </section>

        <section>
          <h3>Inspect in this chapter</h3>
          <ul className="story-list">{chapter.inspectables.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        {chapter.archiveFrames && chapter.archiveFrames.length > 0 && (
          <section>
            <h3>Archival references</h3>
            <div className="story-archive-grid">
              {chapter.archiveFrames.map((frame) => (
                <figure key={`${frame.src}-${frame.title}`}>
                  <img src={frame.src} alt={frame.alt} loading="lazy" />
                  <figcaption><strong>{frame.title}</strong><span>{frame.caption}</span><small>{frame.credit}</small></figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3>Primary references</h3>
          <div className="story-sources">
            {chapter.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                <span><strong>{source.label}</strong>{source.note}</span><ExternalLink size={17} />
              </a>
            ))}
          </div>
        </section>
      </article>

      <footer className="story-footer">
        <button onClick={onPrevious} disabled={index === 0}><ArrowLeft size={17} /> Previous</button>
        <button className="story-return" onClick={onReturn3D}><Play size={17} /> View in 3D</button>
        <button onClick={onNext} disabled={index === total - 1}>Next <ArrowRight size={17} /></button>
      </footer>
    </main>
  );
}
