'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { IconClose, IconSearch } from '@/constants/icons';
import { Spinner } from '@/components/primitives/states/loading';
import { DEBOUNCE_MS } from '@/hooks/shared/use-debounce';
import { useLanguage } from '@/providers/language-provider';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  loading?: boolean;
  id?: string;
  debounceMs?: number;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  loading = false,
  id,
  debounceMs = DEBOUNCE_MS,
}: Props) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t.common.search;
  const immediate = debounceMs <= 0;
  const publishedRef = useRef(value);
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (!immediate && value !== seen) {
    publishedRef.current = value;
    setSeen(value);
    setDraft(value);
  }
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (immediate || Object.is(publishedRef.current, draft)) return () => {};
      const id = window.setTimeout(() => {
        publishedRef.current = draft;
        onChangeRef.current(draft);
        onStoreChange();
      }, debounceMs);
      return () => window.clearTimeout(id);
    },
    [draft, immediate, debounceMs],
  );
  useSyncExternalStore(subscribe, () => publishedRef.current, () => value);
  const shown = immediate ? value : draft;
  const pending = !immediate && shown !== value;
  return (
    <div
      className={cn(
        'flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-background/50 px-2 focus-within:border-primary',
        className,
      )}
    >
      {loading || pending ? (
        <Spinner size="sm" className="size-4" />
      ) : (
        <IconSearch className="size-4 shrink-0 text-muted-foreground" />
      )}
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={shown}
        onChange={(event) => {
          const next = event.target.value;
          if (immediate) onChange(next);
          else setDraft(next);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault();
        }}
        placeholder={resolvedPlaceholder}
        className={cn(
          'h-5 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5 text-foreground outline-none ring-0 placeholder:text-muted-foreground',
          inputClassName,
        )}
      />
      {shown ? (
        <button
          type="button"
          aria-label={t.ui.clearSearch}
          onClick={() => {
            publishedRef.current = '';
            setDraft('');
            onChange('');
          }}
          className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <IconClose className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
