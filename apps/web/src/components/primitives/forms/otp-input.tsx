'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

function normalizeCode(value: string, length: number) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/\D/g, '')
    .slice(0, length);
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  error,
  autoFocus = true,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  'aria-label': string;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative" dir="ltr">
        <Input
          id={id}
          type="text"
          name="one-time-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          pattern={`[0-9]{${length}}`}
          maxLength={length}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => onChange(normalizeCode(event.target.value, length))}
          onPaste={(event) => {
            event.preventDefault();
            onChange(normalizeCode(event.clipboardData.getData('text'), length));
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-text border-0 bg-transparent p-0 text-transparent shadow-none caret-transparent outline-none ring-0 focus-visible:border-0 focus-visible:ring-0 [-webkit-text-fill-color:transparent] selection:bg-transparent dark:bg-transparent"
        />
        <div aria-hidden className="pointer-events-none flex gap-2">
          {Array.from({ length }, (_, index) => (
            <span
              key={index}
              className={cn(
                'flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg border bg-background text-xl font-semibold tabular-nums transition-colors motion-reduce:transition-none',
                error ? 'border-destructive' : 'border-input',
                focused &&
                  index === Math.min(value.length, length - 1) &&
                  'border-ring ring-2 ring-ring/30',
                disabled && 'opacity-50',
              )}
            >
              {value[index] ?? ''}
            </span>
          ))}
        </div>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
