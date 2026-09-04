'use client';

import { useLanguage } from '@/providers/language-provider';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { SearchInput } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { IconCheck, IconChevronsUpDown } from '@/constants/icons';

export type PickerOption = {
  value: string;
  label: string;
  end?: ReactNode;
};

export function PickerSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="border-b p-2">
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full flex-none"
        inputClassName="h-8"
      />
    </div>
  );
}

export function SearchablePicker({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  extraOption,
  leading,
  className,
  size = 'default',
}: {
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  extraOption?: PickerOption;
  leading?: ReactNode;
  className?: string;
  size?: 'default' | 'sm';
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected =
    extraOption && extraOption.value === value
      ? extraOption
      : options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rest = extraOption
      ? options.filter((option) => option.value !== extraOption.value)
      : options;
    const pool = extraOption ? [extraOption, ...rest] : rest;
    if (!term) return pool;
    return pool.filter((option) => option.label.toLowerCase().includes(term));
  }, [extraOption, options, query]);

  const pick = (next: string) => {
    onChange(next);
    setQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn(
            'min-w-0 justify-between gap-2 font-normal',
            size === 'sm' ? 'h-9' : 'h-auto min-h-9 px-2.5 py-2',
            className,
          )}
        >
          <span
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2 text-start',
              !selected && 'text-muted-foreground',
            )}
          >
            {leading}
            <span className="min-w-0 break-words whitespace-normal">
              {selected?.label ?? placeholder ?? t.ui.select}
            </span>
          </span>
          <IconChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-1.5rem,var(--radix-popover-trigger-width))] max-w-[calc(100vw-1.5rem)] p-0"
        align="start"
      >
        <PickerSearch
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
        />
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">
              {emptyText ?? t.common.noMatches}
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value || option.label}
                type="button"
                onClick={() => pick(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-start text-sm hover:bg-muted',
                  option.value === value && 'bg-muted',
                )}
              >
                <span className="min-w-0 flex-1 break-words whitespace-normal">
                  {option.label}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {option.end}
                  {option.value === value ? (
                    <IconCheck className="size-4 shrink-0 text-primary" />
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
