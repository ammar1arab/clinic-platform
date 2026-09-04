'use client';

import { Button } from '@/components/ui';
import { IconChevronLeft, IconChevronRight } from '@/constants/icons';
import { useLanguage } from '@/providers';

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
  const { t, dir } = useLanguage();
  if (totalItems === 0 || pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const PrevIcon = dir === 'rtl' ? IconChevronRight : IconChevronLeft;
  const NextIcon = dir === 'rtl' ? IconChevronLeft : IconChevronRight;

  return (
    <nav
      aria-label={`${t.common.showing} (${page}/${pageCount})`}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/90 px-3.5 py-2 shadow-xs backdrop-blur-xs"
    >
      <p className="min-w-0 truncate text-xs text-muted-foreground">
        <span className="hidden sm:inline">{t.common.showing} </span>
        {start}–{end} {t.common.of} {totalItems}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1, onPageChange)}
          aria-label={t.common.previous}
        >
          <PrevIcon className="size-4" />
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
          aria-label={t.common.next}
        >
          <NextIcon className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
