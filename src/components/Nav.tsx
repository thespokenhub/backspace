import { useEffect, useRef } from 'react';
import { CASES, CASE_IDS, type CaseId } from '../lib/cases';
import { Logo } from './common';

interface Props {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onHome: () => void;
  onFeatures: () => void;
  onHow: () => void;
  onTry: () => void;
  onCase: (id: CaseId) => void;
}

export function Nav({ menuOpen, setMenuOpen, onHome, onFeatures, onHow, onTry, onCase }: Props) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <nav className="nav" ref={navRef}>
      <Logo onClick={onHome} />
      <div className="nav-links">
        <button type="button" className="nav-link" onClick={onFeatures}>Features</button>
        <div className="nav-menu-wrap">
          <button type="button" className="nav-link" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            Use cases ▾
          </button>
          {menuOpen && (
            <div className="nav-menu">
              {CASE_IDS.map((id) => (
                <button type="button" key={id} className="nav-menu-item" onClick={() => onCase(id)}>
                  <b>{CASES[id].title}</b>
                  <span>{CASES[id].short}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="nav-link" onClick={onHow}>How it works</button>
      </div>
      <div className="spacer" />
      <button type="button" className="nav-cta" onClick={onTry}>Try it free</button>
    </nav>
  );
}
