'use client';

import { useMemo, useState } from 'react';
import { getCountries, type Country } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { IconCheck, IconChevronDown, IconSearch } from '@/constants/icons';
import { getTranslations } from '@/i18n';
import { useLanguage } from '@/providers/language-provider';

export type CountryCode = Country;

type CountryOption = {
  value: CountryCode;
  label: string;
};

export function countryLabel(
  code: string | null | undefined,
  lang?: string,
): string | null {
  if (!code) return null;
  const labels: Record<string, string> = getTranslations(
    lang ?? 'en',
  ).countries;
  return labels[code] ?? code;
}

function Flag({ country, title }: { country: CountryCode; title: string }) {
  const Component = flags[country];
  if (!Component) {
    return (
      <span className="grid size-5 place-items-center rounded-[2px] bg-muted text-[0.6rem] text-muted-foreground">
        {country}
      </span>
    );
  }
  return (
    <span className="inline-flex size-5 shrink-0 overflow-hidden rounded-[2px] [&_svg]:size-full">
      <Component title={title} />
    </span>
  );
}

type Props = {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
};

export function CountrySelect({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  allowClear = true,
}: Props) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const resolvedPlaceholder = placeholder ?? t.common.selectCountry;

  const countryOptions: CountryOption[] = useMemo(() => {
    const labels: Record<string, string> = t.countries;
    return getCountries()
      .map((code) => ({
        value: code,
        label: labels[code] ?? code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [lang, t]);

  const selected = useMemo(
    () => countryOptions.find((option) => option.value === value),
    [countryOptions, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return countryOptions;
    return countryOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [countryOptions, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors',
            'hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          {selected ? (
            <>
              <Flag country={selected.value} title={selected.label} />
              <span className="min-w-0 flex-1 truncate text-start text-foreground">
                {selected.label}
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1 truncate text-start">
              {resolvedPlaceholder}
            </span>
          )}
          <IconChevronDown
            className="size-3.5 shrink-0 opacity-60"
            aria-hidden
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="z-120 w-(--radix-popover-trigger-width) min-w-[16rem] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border/70 px-2.5 py-2">
          <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.common.searchCountry}
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
          {allowClear && value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
                setOpen(false);
              }}
              className="flex w-full items-center rounded-md px-2 py-1.5 text-start text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {t.common.clearSelection}
            </button>
          ) : null}

          {filtered.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">
              {t.common.noCountriesFound}
            </p>
          ) : (
            filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    active && 'bg-accent text-accent-foreground',
                  )}
                >
                  <Flag country={option.value} title={option.label} />
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {active ? (
                    <IconCheck className="size-3.5 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
