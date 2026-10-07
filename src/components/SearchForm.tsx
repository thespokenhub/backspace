import type { FormEvent, Ref } from 'react';
import { MONTHS } from '../lib/backspace';

export interface When {
  year: number | null;
  month: number | null; // 1-12
}

const FIRST_YEAR = 1996;

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  variant: 'hero' | 'cta';
  inputRef?: Ref<HTMLInputElement>;
  /** Optional "when" picker: land on a year or a month straight away. */
  when?: When;
  setWhen?: (w: When) => void;
}

export function SearchForm({ value, onChange, onSubmit, variant, inputRef, when, setWhen }: Props) {
  const now = new Date();
  const years = Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => now.getFullYear() - i);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form className={variant === 'hero' ? 'hero-form' : 'cta-form'} onSubmit={submit}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a website, like apple.com"
        aria-label="Website address"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {when && setWhen && (
        <div className="when">
          <select
            value={when.year ?? ''}
            onChange={(e) => {
              const year = e.target.value ? +e.target.value : null;
              const futureMonth = year === now.getFullYear() && when.month != null && when.month > now.getMonth() + 1;
              setWhen({ year, month: year && !futureMonth ? when.month : null });
            }}
            aria-label="Year"
          >
            <option value="">Any year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={when.month ?? ''}
            onChange={(e) => setWhen({ ...when, month: e.target.value ? +e.target.value : null })}
            disabled={!when.year}
            aria-label="Month"
            title={when.year ? undefined : 'Pick a year first'}
          >
            <option value="">Any month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1} disabled={when.year === now.getFullYear() && i > now.getMonth()}>{m}</option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="btn-accent">Show its history</button>
    </form>
  );
}
