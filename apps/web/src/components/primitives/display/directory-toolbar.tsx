'use client';

import type { ReactNode } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { SearchInput } from '@/components/primitives';
import { SoftTip } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { IconChevronsUpDown } from '@/constants/icons';
import { useLanguage } from '@/providers/language-provider';

export const DIRECTORY_ACTION_CLASS =
  'size-8 shrink-0 px-0 shadow-2xs active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5';

export function DirectoryToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  actions,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  actions: ReactNode;
}) {
  return (
    <div className="card-aura flex items-center gap-1.5 rounded-xl border bg-card/90 p-2 shadow-xs backdrop-blur-md sm:gap-2 sm:rounded-2xl sm:p-2.5">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="min-w-0 flex-1"
        inputClassName="h-9 bg-background/50"
      />
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {actions}
      </div>
    </div>
  );
}

export function DirectorySortMenu({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  const { t } = useLanguage();
  const current =
    options.find((o) => o.value === value)?.label ?? t.common.sort;

  return (
    <DropdownMenu>
      <SoftTip label={`${t.common.sort}: ${current}`}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`${t.common.sort}: ${current}`}
            className={cn(
              DIRECTORY_ACTION_CLASS,
              'border-border/70 bg-background/50',
            )}
          >
            <IconChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="hidden max-w-28 truncate font-semibold sm:inline">
              {current}
            </span>
          </Button>
        </DropdownMenuTrigger>
      </SoftTip>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t.common.sort}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
