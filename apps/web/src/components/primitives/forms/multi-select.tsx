'use client';

import { useLanguage } from '@/providers/language-provider';

import { useState } from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/primitives/states/empty';
import { SearchInput } from '@/components/primitives/forms/search-input';
import { SelectionToggle } from '@/components/primitives/forms/selection-toggle';
import { SoftTip } from '@/components/primitives/display/soft-tip';
import {
  IconCheck,
  IconChevronsUpDown,
  IconSearch,
} from '@/constants/icons';

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
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
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

  const allChecked: boolean | 'mixed' =
    selected.length === 0
      ? false
      : selected.length === options.length
        ? true
        : 'mixed';

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
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-start">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">
                {placeholder ?? t.ui.select}
              </span>
            ) : (
              <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">
                <span className="truncate">
                  {t.ui.selectedCount.replace('{count}', String(selected.length))}
                </span>
              </span>
            )}
          </span>
          <IconChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
        align="start"
      >
        <div className="flex items-center gap-2 border-b border-border p-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder ?? t.common.search}
            debounceMs={0}
            className="h-8 flex-1"
          />
          <SoftTip label={allChecked === true ? t.common.clear : t.ui.selectAll}>
            <SelectionToggle
              label={allChecked === true ? t.common.clear : t.ui.selectAll}
              checked={allChecked}
              onChange={(checked) => (checked ? selectAll() : clear())}
            />
          </SoftTip>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <EmptyState
              icon={IconSearch}
              title={emptyText ?? t.ui.noOptions}
              size="compact"
            />
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
                      isSelected &&
                        'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {isSelected ? <IconCheck className="size-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
