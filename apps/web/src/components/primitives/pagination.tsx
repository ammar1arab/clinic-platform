'use client';

import { Button } from '@/components/ui';
import { IconChevronLeft, IconChevronRight } from '@/constants/icons';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function goToPage(page: number, onPageChange: (page: number) => void) {
  onPageChange(page);
  const main = document.querySelector('main');
  if (main instanceof HTMLElement) {
    main.scrollTo({ top: 0, behavior: 'auto' });
  }
}

export function Pagination({ page, pageCount, totalItems, pageSize, onPageChange }: Props) {
  if (totalItems === 0 || pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <>
      <div aria-hidden className="h-app-pagination-bar shrink-0" />
      <nav
        aria-label="Pagination"
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-0 z-30 inset-s-app-sidebar',
          'px-app-main-pad pt-1',
          'pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]',
          'transition-[inset-inline-start] duration-300 ease-in-out',
        )}
      >
        <div
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3',
            'rounded-xl border border-border/70 bg-card/95 px-2.5 py-1.5',
            'shadow-sm ring-1 ring-foreground/10 backdrop-blur-md',
          )}
        >
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="hidden sm:inline">Showing </span>
            {start}–{end} of {totalItems}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1, onPageChange)}
              aria-label="Previous page"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="min-w-12 px-1 text-center text-xs font-medium tabular-nums text-foreground">
              {page}
              <span className="font-normal text-muted-foreground"> / {pageCount}</span>
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= pageCount}
              onClick={() => goToPage(page + 1, onPageChange)}
              aria-label="Next page"
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
