'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toKana } from 'wanakana';
import { cn } from '@/lib/utils';

interface ReviewInputProps {
  type: 'meaning' | 'reading';
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export default function ReviewInput({
  type,
  onSubmit,
  disabled,
}: ReviewInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and when type changes
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
    setValue('');
  }, [type, disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      if (type === 'reading') {
        // Convert romaji to kana as user types
        try {
          const converted = toKana(raw, { IMEMode: true });
          setValue(converted);
        } catch {
          setValue(raw);
        }
      } else {
        setValue(raw);
      }
    },
    [type]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim() !== '' && !disabled) {
        onSubmit(value.trim());
      }
    },
    [value, disabled, onSubmit]
  );

  const handleSubmit = useCallback(() => {
    if (value.trim() !== '' && !disabled) {
      onSubmit(value.trim());
    }
  }, [value, disabled, onSubmit]);

  return (
    <div className="space-y-3">
      {/* Label */}
      <label
        htmlFor="review-input"
        className={cn(
          'block text-center text-sm font-semibold uppercase tracking-wider',
          type === 'meaning'
            ? 'text-foreground'
            : 'text-primary'
        )}
      >
        {type === 'meaning' ? 'Meaning' : 'Reading'}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          id="review-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={
            type === 'meaning'
              ? 'Type the meaning...'
              : 'Type the reading in romaji...'
          }
          className={cn(
            'w-full rounded-xl border-2 px-4 py-4 text-center text-2xl font-medium outline-none transition-colors',
            'bg-card text-foreground placeholder:text-muted-foreground/40',
            type === 'reading' && 'font-japanese',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
          )}
        />
      </div>

      {/* Submit hint */}
      {!disabled && value.trim() !== '' && (
        <p className="text-center text-xs text-muted-foreground">
          Press <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Enter</kbd> to submit
        </p>
      )}

      {/* Mobile submit button */}
      {!disabled && value.trim() !== '' && (
        <button
          onClick={handleSubmit}
          className="mx-auto flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:hidden"
        >
          Submit
        </button>
      )}
    </div>
  );
}
