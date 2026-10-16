'use client';

import { useLanguage } from '@/providers';

export function MobileMenuToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  const label = open ? t.layout.sidebar.closeMenu : t.layout.sidebar.openMenu;

  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls="mobile-navigation"
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/80 bg-card/80 text-foreground shadow-sm transition-transform duration-200 hover:bg-muted active:scale-90 motion-reduce:transition-none"
    >
      <span aria-hidden="true" className="relative size-4">
        <span
          className={`absolute start-0 h-0.5 w-4 rounded-full bg-current transition-[top,transform] duration-300 ease-out motion-reduce:transition-none ${
            open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-[3px]'
          }`}
        />
        <span
          className={`absolute start-0 top-[7px] h-0.5 w-4 rounded-full bg-current transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
          }`}
        />
        <span
          className={`absolute start-0 h-0.5 w-4 rounded-full bg-current transition-[top,transform] duration-300 ease-out motion-reduce:transition-none ${
            open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'top-[11px]'
          }`}
        />
      </span>
    </button>
  );
}
