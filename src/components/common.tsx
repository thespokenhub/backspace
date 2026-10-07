export function LoaderBar({ size }: { size?: 'md' | 'sm' }) {
  return (
    <div className={size ? `loader loader--${size}` : 'loader'} role="progressbar" aria-label="Loading">
      <div />
    </div>
  );
}

export function Logo({ small, onClick }: { small?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={small ? 'logo logo--small' : 'logo'} onClick={onClick}>
      <span className="logo-key" aria-hidden="true">⌫</span>Backspace
    </button>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <strong>⌫ Backspace</strong>
      <span>See any website the way it used to look.</span>
    </footer>
  );
}
