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
      className="relative flex size-8 items-center justify-center rounded-lg bg-muted/40 transition-colors duration-200 hover:bg-muted active:scale-95"
    >
      <div className="relative flex h-3 w-4 flex-col justify-between">
        {/* Top Line */}
        <span
          className={cn(
            'h-[1.5px] w-full rounded-full bg-foreground transition-all duration-300 ease-in-out',
            open ? 'translate-y-[5.25px] rotate-45 bg-primary' : ''
          )}
        />
        {/* Middle Line */}
        <span
          className={cn(
            'h-[1.5px] w-full rounded-full bg-foreground transition-all duration-200 ease-in-out',
            open ? 'scale-0 opacity-0' : 'opacity-100'
          )}
        />
        {/* Bottom Line */}
        <span
          className={cn(
            'h-[1.5px] w-full rounded-full bg-foreground transition-all duration-300 ease-in-out',
            open ? '-translate-y-[5.25px] -rotate-45 bg-primary' : ''
          )}
        />
      </div>
    </button>
  );
}
