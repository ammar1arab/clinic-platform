'use client';

import { useId, type ComponentProps } from 'react';
import { Input } from '@/components/ui';
import { FormField } from './form-field';

export function FloatingInput({ label, error, id, ...props }: ComponentProps<typeof Input> & { label: string; error?: string }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FormField error={error}>
      <div className="group relative pt-3">
        <Input {...props} id={inputId} placeholder=" " aria-invalid={!!error}
          aria-describedby={error ? inputId + '-error' : props['aria-describedby']}
          className="peer h-12 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent" />
        <label htmlFor={inputId}
          className="pointer-events-none absolute start-0 top-0 text-xs text-primary transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary motion-reduce:transition-none">
          {label}
        </label>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-primary transition-transform duration-200 group-focus-within:scale-x-100 motion-reduce:transition-none" />
      </div>
      {error && <span id={inputId + '-error'} className="sr-only">{error}</span>}
    </FormField>
  );
}
