import { useEffect, useLayoutEffect, useState } from 'react';

const KEY = 'backspace.tour-done';

export function tourSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // storage blocked; the tour may show again next time
  }
}

interface Step {
  sel: string;
  title: string;
  text: string;
}

const steps = (compare: boolean): Step[] => [
  compare
    ? { sel: '[data-tour="banner"]', title: 'Two dates, side by side', text: 'Orange is copy A, blue is copy B. Pick a date for each side, or swipe between them.' }
    : { sel: '[data-tour="banner"]', title: "This tells you what you're looking at", text: 'The site, and the exact day this copy was saved. It updates as you move through time.' },
  { sel: '[data-tour="timeline"]', title: 'Drag to travel through time', text: 'Each bar is one saved copy. Tall bars are days the page changed. Hover for a preview, let go to open it.' },
  { sel: '[data-tour="years"]', title: 'Or jump straight to a year', text: 'First version takes you to the oldest copy. Years and months take you to the first copy saved in them.' },
  { sel: '[data-tour="tabs"]', title: 'Four ways to look', text: 'Page shows one day. Compare puts two dates side by side. All pages lists every URL. Changes lists every date it changed.' },
  { sel: '[data-tour="share"]', title: 'Share exactly this view', text: "The link always points to the date and view you're on. Paste it anywhere." },
];

const PAD = 6;
const CARD_W = 340;

export function Tour({ compare, onDone }: { compare: boolean; onDone: () => void }) {
  const all = steps(compare);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const list = all.filter((s) => document.querySelector(s.sel));
  const step = list[Math.min(i, list.length - 1)];

  const close = () => {
    markSeen();
    onDone();
  };
  const next = () => (i >= list.length - 1 ? close() : setI(i + 1));

  const sel = step?.sel;
  useLayoutEffect(() => {
    const measure = () => setRect(sel ? document.querySelector(sel)?.getBoundingClientRect() ?? null : null);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') close();
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft' && i > 0) setI(i - 1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  if (!step || !rect) return null;

  const below = rect.bottom + 14 + 200 < window.innerHeight;
  const left = Math.max(12, Math.min(window.innerWidth - CARD_W - 12, rect.left + rect.width / 2 - CARD_W / 2));
  const cardStyle = below ? { top: rect.bottom + PAD + 12, left } : { bottom: window.innerHeight - rect.top + PAD + 12, left };

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="How this screen works">
      <div className="tour-block" onClick={close} />
      <div className="tour-spot" style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }} />
      <div className="tour-card" style={{ ...cardStyle, width: CARD_W }}>
        <div className="tour-count">{i + 1} of {list.length}</div>
        <div className="tour-title">{step.title}</div>
        <div className="tour-text">{step.text}</div>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={close}>Skip tour</button>
          <div className="spacer" />
          {i > 0 && <button type="button" className="tour-back" onClick={() => setI(i - 1)}>Back</button>}
          <button type="button" className="tour-next" onClick={next} autoFocus>{i >= list.length - 1 ? 'Got it' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
