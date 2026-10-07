import type { FormEvent, Ref } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  variant: 'hero' | 'cta';
  inputRef?: Ref<HTMLInputElement>;
}

export function SearchForm({ value, onChange, onSubmit, variant, inputRef }: Props) {
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
      <button type="submit" className="btn-accent">Show its history</button>
    </form>
  );
}
