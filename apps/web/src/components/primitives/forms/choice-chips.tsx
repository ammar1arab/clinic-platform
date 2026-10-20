'use client';

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export type ChoiceOption = { value: string; label: string };

export type ChoiceProps = {
  label: string;
  options: ChoiceOption[];
  disabled?: boolean;
  className?: string;
} & (
  | { multiple?: false; value: string; onChange: (value: string) => void }
  | { multiple: true; value: string[]; onChange: (value: string[]) => void }
);

export function ChoiceChips(props: ChoiceProps) {
  const { label, options, disabled, className } = props;
  const isOn = (value: string) => (props.multiple ? props.value.includes(value) : props.value === value);
  const pick = (value: string) => {
    if (!props.multiple) return value !== props.value && props.onChange(value);
    props.onChange(props.value.includes(value) ? props.value.filter((item) => item !== value) : [...props.value, value]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            disabled={disabled}
            variant={isOn(option.value) ? 'default' : 'outline'}
            aria-pressed={isOn(option.value)}
            className="max-w-full"
            onClick={() => pick(option.value)}
          >
            <span className="truncate">{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
