'use client';

import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { IconClose, IconSearch } from '@/constants/icons';
import { useLanguage } from '@/providers/language-provider';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: Props) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t.common.search;
  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <IconSearch className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        placeholder={resolvedPlaceholder}
        className={cn('h-8 rounded-lg ps-8 pe-8', inputClassName)}
      />
      {value ? (
        <button
          type="button"
          aria-label={t.ui.clearSearch}
          onClick={() => onChange('')}
          className="absolute end-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <IconClose className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
