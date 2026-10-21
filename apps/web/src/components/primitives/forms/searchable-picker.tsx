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
        debounceMs={0}
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
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn(
            'w-full min-w-0 justify-between gap-1.5 overflow-hidden font-normal',
            size === 'sm' ? 'h-8 text-xs' : 'h-8 text-sm',
            className,
          )}
        >
          <span
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2',
              !selected && 'text-muted-foreground',
            )}
          >
            {leading}
            <span className="min-w-0 flex-1 truncate text-start">
              {selected?.label ?? placeholder ?? t.ui.select}
            </span>
          </span>
          <IconChevronsUpDown
            className={cn(
              'shrink-0 opacity-50',
              size === 'sm' ? 'size-3.5' : 'size-4',
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="picker-scroll w-(--radix-popover-trigger-width) min-w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(20rem,var(--radix-popover-content-available-height))] max-w-[calc(100vw-1.5rem)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-popover">
          <PickerSearch
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="p-1">
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
                  'flex w-full touch-pan-y items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-start text-xs sm:text-sm hover:bg-muted',
                  option.value === value && 'bg-muted',
                )}
              >
                <span className="min-w-0 flex-1 text-start leading-snug wrap-break-word">
                  {option.label}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <IconCheck className={cn('size-4 shrink-0 text-primary', option.value !== value && 'invisible')} />
                  {option.end}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
