'use client';

import { useMemo, useState } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { IconCheck, IconChevronsUpDown } from '@/constants/icons';
import { useLanguage } from '@/providers/language-provider';
import { cn } from '@/lib/utils';
import { PickerSearch } from './searchable-picker';

export type MultiSelectOption = {
  value: string;
  label: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  disabled,
}: {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Kept for call-site compatibility; the dropdown shows the placeholder instead. */
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const toggle = (next: string) => {
    onChange(value.includes(next) ? value.filter((item) => item !== next) : [...value, next]);
  };

  return (
    <Popover modal open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-auto min-h-8 w-full min-w-0 justify-between gap-1.5 overflow-hidden py-1.5 font-normal', className)}
        >
          <span className={cn('min-w-0 flex-1 truncate text-start', selected.length === 0 && 'text-muted-foreground')}>
            {selected.length > 0 ? selected.map((option) => option.label).join(', ') : placeholder ?? t.ui.select}
          </span>
          {selected.length > 0 ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary tabular-nums">{selected.length}</span>
          ) : null}
          <IconChevronsUpDown className="size-4 shrink-0 opacity-50" />
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
          <PickerSearch value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        </div>
        <div className="p-1">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-control text-muted-foreground">{emptyText ?? t.common.noMatches}</p>
          ) : (
            filtered.map((option) => {
              const checked = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(option.value)}
                  className={cn(
                    'flex w-full touch-pan-y items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-start text-control hover:bg-muted',
                    checked && 'bg-muted',
                  )}
                >
                  <span className="min-w-0 flex-1 text-start leading-snug wrap-break-word">{option.label}</span>
                  <IconCheck className={cn('size-4 shrink-0 text-primary', !checked && 'invisible')} />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
