'use client';

import type { ReactNode } from 'react';
import { Badge, Button, PopoverContent, PopoverTrigger } from '@/components/ui';
import { IconClose, IconFilters } from '@/constants/icons';
import { keepNestedPortals } from '@/lib/overlay';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import { DIRECTORY_ACTION_CLASS, DIRECTORY_FILTER_BUTTON_CLASS } from './directory-toolbar';

export function FilterTrigger({ count }: { count: number }) {
  const { t } = useLanguage();
  return (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={t.common.filters}
        className={cn(DIRECTORY_ACTION_CLASS, count > 0 && DIRECTORY_FILTER_BUTTON_CLASS, 'border-border/70 bg-background/50', count > 0 && 'border-primary/35 bg-primary/5')}
      >
        <IconFilters className={cn('size-3.5 shrink-0', count > 0 ? 'text-primary' : 'text-muted-foreground')} />
        <span className="hidden font-semibold sm:inline">{t.common.filters}</span>
        {count > 0 ? <Badge variant="info" className="ms-0 h-5 min-w-5 justify-center px-1 text-xs">{count}</Badge> : null}
      </Button>
    </PopoverTrigger>
  );
}

export function FilterPanel({
  count,
  onClear,
  children,
  className,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <PopoverContent
      align="end"
      className={cn('w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(34rem,calc(100dvh-var(--app-header-height)-1.5rem))] space-y-3 overflow-y-auto p-3 sm:p-4', className)}
      onInteractOutside={keepNestedPortals}
      onFocusOutside={keepNestedPortals}
    >
      <div className="sticky -top-3 z-10 -mx-3 -mt-3 flex items-center justify-between border-b border-border/60 bg-popover px-3 py-2 sm:-top-4 sm:-mx-4 sm:-mt-4 sm:px-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {t.common.filters}
          {count > 0 ? <Badge variant="info" className="h-5 min-w-5 justify-center px-1 text-xs">{count}</Badge> : null}
        </p>
        {count > 0 ? (
          <Button type="button" variant="ghost" size="xs" onClick={onClear}>
            <IconClose className="size-3.5" />
            {t.common.clear}
          </Button>
        ) : null}
      </div>
      {children}
    </PopoverContent>
  );
}
