'use client';

import { cn } from '@/lib/utils';

export function MobileMenuToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      className="group relative flex size-10 items-center justify-center rounded-xl bg-card border border-border/60 shadow-sm transition-all duration-300 active:scale-90"
    >
      <div
        className={cn(
          'flex h-4 w-5 flex-col justify-between transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          open ? 'rotate-[180deg]' : ''
        )}
      >
        <span
          className={cn(
            'h-[2px] w-full rounded-full bg-foreground transition-all duration-300',
            open ? 'w-3 translate-x-1 translate-y-[5px] rotate-45 bg-primary' : ''
          )}
        />
        <span
          className={cn(
            'h-[2px] w-full rounded-full bg-foreground transition-all duration-300',
            open ? 'translate-x-0.5 bg-primary' : ''
          )}
        />
        <span
          className={cn(
            'h-[2px] w-full rounded-full bg-foreground transition-all duration-300',
            open ? 'w-3 translate-x-1 -translate-y-[5px] -rotate-45 bg-primary' : ''
          )}
        />
      </div>
    </button>
  );
}
