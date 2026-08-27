'use client';

import { useMemo, useState, type ComponentType } from 'react';
import PhoneInput, {
  type Country,
  getCountryCallingCode,
} from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { IconCheck, IconChevronDown, IconSearch } from '@/constants/icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

type CountryOption = {
  value?: string;
  label: string;
  divider?: boolean;
};

type CountryIconProps = {
  country?: string;
  label?: string;
  aspectRatio?: number;
};

type CountrySelectProps = {
  value?: string;
  options: CountryOption[];
  onChange: (value?: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent: ComponentType<CountryIconProps>;
  className?: string;
  'aria-label'?: string;
};

function callingCode(country?: string) {
  if (!country) return null;
  try {
    return `+${getCountryCallingCode(country as Country)}`;
  } catch {
    return null;
  }
}

function PhoneCountrySelect({
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  disabled,
  readOnly,
  iconComponent: Icon,
  className,
  'aria-label': ariaLabel,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((option) => !option.divider && option.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^\+/, '');
    const list = options.filter((option) => !option.divider);
    if (!term) return list;
    return list.filter((option) => {
      const code = callingCode(option.value)?.replace('+', '') ?? '';
      return (
        option.label.toLowerCase().includes(term) ||
        code.includes(term) ||
        (option.value?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled || readOnly) return;
        setOpen(next);
        if (next) {
          onFocus?.();
          return;
        }
        setQuery('');
        onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || readOnly}
          aria-label={ariaLabel ?? 'Select country'}
          className={cn(
            'PhoneInputCountry inline-flex h-full shrink-0 items-center gap-1 rounded-md px-0.5',
            'text-foreground outline-none transition-colors',
            'hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <Icon aria-hidden country={value} label={selected?.label} />
          <IconChevronDown className="size-3 opacity-60" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-[120] w-[min(100vw-1.5rem,18rem)] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border/70 px-2.5 py-2">
          <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="IconSearch country…"
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
          {filtered.length === 0 && (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">
              No countries found.
            </p>
          )}

          {filtered.map((option) => {
            const code = callingCode(option.value);
            const active = option.value === value;
            return (
              <button
                key={option.value ?? 'ZZ'}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery('');
                  setOpen(false);
                  onBlur?.();
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-popover-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  active && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[2px]">
                  <Icon
                    aria-hidden
                    country={option.value}
                    label={option.label}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {code && (
                  <span className="shrink-0 text-xs text-muted-foreground">{code}</span>
                )}
                {active && <IconCheck className="size-3.5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PhoneInputField({ value, onChange, className, disabled }: Props) {
  return (
    <PhoneInput
      international
      defaultCountry="JO"
      value={value}
      disabled={disabled}
      onChange={(val) => onChange(val ?? '')}
      countrySelectComponent={PhoneCountrySelect}
      className={cn(
        'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors md:text-sm',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        'has-disabled:cursor-not-allowed has-disabled:opacity-50',
        'dark:bg-input/30',
        '[&_input]:min-w-0 [&_input]:flex-1 [&_input]:bg-transparent [&_input]:text-base [&_input]:text-foreground [&_input]:outline-none md:[&_input]:text-sm [&_input]:placeholder:text-muted-foreground',
        '[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:shrink-0',
        className,
      )}
    />
  );
}
