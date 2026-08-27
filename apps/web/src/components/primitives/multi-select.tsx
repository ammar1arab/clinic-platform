'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No options',
  className,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.filter((o) => value.includes(o.value));
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  };

  const clear = () => onChange([]);

  const selectAll = () => onChange(options.map((o) => o.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 font-normal',
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-left">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <span
                  key={item.value}
                  className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground"
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="rounded-sm text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(item.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(item.value);
                      }
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </span>
              ))
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" align="start">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 ps-8"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={selectAll}>
              Select all
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clear}>
              Clear
            </Button>
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/60',
                  )}
                  onClick={() => toggle(option.value)}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-sm border border-border',
                      isSelected && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {isSelected ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
