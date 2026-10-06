import { CASES, CASE_IDS, type CaseId } from '../lib/cases';
import { Footer } from './common';

interface Props {
  caseId: CaseId;
  onExample: () => void;
  onTry: () => void;
  onCase: (id: CaseId) => void;
}

export function UseCasePage({ caseId, onExample, onTry, onCase }: Props) {
  const c = CASES[caseId];
  return (
    <div>
      <section className="uc-hero">
        <div className="mono-kicker">{c.kicker}</div>
        <h1>{c.headline}</h1>
        <p className="uc-intro">{c.intro}</p>
        <div className="uc-actions">
          <button type="button" className="btn-accent" onClick={onExample}>{c.example.label} →</button>
          <button type="button" className="btn-outline" onClick={onTry}>Use my own site</button>
        </div>
      </section>
      <section className="uc-section">
        <div className="uc-tasks">
          {c.tasks.map(([title, text, tool], i) => (
            <div className="uc-task" key={title}>
              <div className="uc-task-head">
                <span className="mono-kicker">0{i + 1}</span>
                <span className="uc-uses">Uses: {tool}</span>
              </div>
              <div className="uc-task-title">{title}</div>
              <div className="uc-task-text">{text}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="uc-others">
        <div className="uc-others-label">OTHER USE CASES</div>
        <div className="uc-others-grid">
          {CASE_IDS.filter((k) => k !== caseId).map((k) => (
            <button type="button" key={k} className="uc-other" onClick={() => onCase(k)}>
              <span><b>{CASES[k].title}</b><small>{CASES[k].short}</small></span>
              <span className="arrow">→</span>
            </button>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
