import { useEffect, useState } from 'react';

// Copies the current address. The URL always describes the exact view on screen.
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    const href = window.location.href;
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      window.prompt('Copy this link:', href);
    }
    setCopied(true);
  };

  return (
    <button type="button" className="share-btn" data-tour="share" onClick={copy} aria-live="polite">
      {copied ? '✓ Link copied' : 'Copy link'}
    </button>
  );
}
