'use client';

import { useState } from 'react';
import { IconCheck, IconSearch } from '@/constants/icons';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import { EmptyState } from '@/components/primitives/states/empty';
import { Skeleton } from '@/components/ui';
import { SearchInput } from './search-input';
import { SelectionToggle } from './selection-toggle';

export type OptionListItem = { value: string; label: string; disabled?: boolean };

const SEARCH_THRESHOLD = 6;

export function OptionList({
  options,
  value,
  onChange,
  multiple = false,
  label,
  loading = false,
}: {
  options: OptionListItem[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  label: string;
  loading?: boolean;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options;
  const selectable = visible.filter((option) => !option.disabled);
  const chosen = selectable.filter((option) => value.includes(option.value)).length;
  const allState: boolean | 'mixed' = chosen === 0 ? false : chosen === selectable.length ? true : 'mixed';
  const showSearch = options.length > SEARCH_THRESHOLD;
  const pick = (optionValue: string) => {
    if (!multiple) return onChange([optionValue]);
    onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);
  };
  const toggleVisible = (checked: boolean) => {
    const visibleValues = selectable.map((option) => option.value);
    onChange(checked ? [...new Set([...value, ...visibleValues])] : value.filter((item) => !visibleValues.includes(item)));
  };
  return (
    <div className="space-y-1.5">
      {multiple || showSearch ? (
        <div className="flex items-center gap-2 px-0.5">
          {multiple ? (
            <SelectionToggle
              checked={allState}
              disabled={loading || selectable.length === 0}
              label={allState === true ? t.common.clearSelection : t.ui.selectAll}
              onChange={toggleVisible}
              className="ms-2"
            />
          ) : null}
          {showSearch ? <SearchInput value={query} onChange={setQuery} placeholder={t.common.search} debounceMs={0} className="h-8 min-w-0 flex-1" /> : <span className="text-xs text-muted-foreground">{t.ui.selectAll}</span>}
        </div>
      ) : null}
      <div role="listbox" aria-label={label} aria-multiselectable={multiple} className="max-h-56 space-y-0.5 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-8 w-full rounded-lg" />)
        ) : visible.length === 0 ? (
          <EmptyState icon={IconSearch} title={t.ui.noOptions} size="compact" />
        ) : (
          visible.map((option) => {
            const selected = value.includes(option.value);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={selected}
                aria-disabled={option.disabled || undefined}
                tabIndex={option.disabled ? -1 : 0}
                onClick={() => !option.disabled && pick(option.value)}
                onKeyDown={(event) => {
                  if (option.disabled || event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    pick(option.value);
                  }
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm outline-none transition-colors duration-(--motion-fast) hover:bg-muted/60 focus-visible:bg-muted/60 motion-reduce:transition-none',
                  selected && 'font-medium text-primary',
                  option.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                )}
              >
                {multiple ? <SelectionToggle checked={selected} label={option.label} disabled={option.disabled} onChange={() => pick(option.value)} /> : null}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {!multiple ? <IconCheck aria-hidden className={cn('size-4 shrink-0 transition-opacity duration-(--motion-fast)', selected ? 'opacity-100' : 'opacity-0')} /> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
