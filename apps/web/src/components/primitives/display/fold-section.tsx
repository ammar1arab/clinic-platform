'use client';

import type { ReactNode } from 'react';
import { IconChevronDown } from '@/constants/icons';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';

const FOLD_MOTION = 'duration-[var(--overlay-duration)] ease-[var(--overlay-ease)] motion-reduce:transition-none';

export function FoldSection({
  label,
  count,
  open,
  onToggle,
  children,
  className,
}: {
  label: string;
  count?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <section className={className}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${open ? t.layout.sidebar.collapse : t.layout.sidebar.expand} ${label}`}
        className="flex w-full items-center gap-1.5 text-start"
      >
        <IconChevronDown
          aria-hidden
          className={cn('size-3 shrink-0 text-muted-foreground/70 transition-transform', FOLD_MOTION, !open && '-rotate-90 rtl:rotate-90')}
        />
        <h3 className="min-w-0 flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</h3>
        {count !== undefined ? <span className="text-2xs tabular-nums text-muted-foreground">{count}</span> : null}
      </button>
      <div className={cn('grid transition-[grid-template-rows]', FOLD_MOTION, open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
