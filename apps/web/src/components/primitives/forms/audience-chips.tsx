'use client';

import { Button, Skeleton } from '@/components/ui';
import { OverflowActions } from '@/components/primitives/display/overflow-actions';

export type AudienceOption = { value: string; label: string };

export function AudienceChips({
  label,
  options,
  value,
  onChange,
  loading = false,
  disabled = false,
}: {
  label: string;
  options: AudienceOption[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <OverflowActions label={label}>
      {loading
        ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-7 w-20 shrink-0 rounded-md" />)
        : options.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              className="shrink-0"
              disabled={disabled}
              variant={value === option.value ? 'default' : 'outline'}
              aria-pressed={value === option.value}
              onClick={() => value !== option.value && onChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
    </OverflowActions>
  );
}
