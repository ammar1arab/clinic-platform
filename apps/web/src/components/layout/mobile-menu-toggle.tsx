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
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/80 bg-card/80 text-foreground shadow-sm transition-transform duration-200 active:scale-90 motion-reduce:transition-none md:hover:bg-muted"
    >
      <span aria-hidden="true" className="relative size-4">
        <span
          className={`absolute start-0 top-[2px] h-0.5 w-4 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? 'translate-y-[5px] rotate-45' : ''
          }`}
        />
        <span
          className={`absolute start-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded-full bg-current transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
            open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
          }`}
        />
        <span
          className={`absolute start-0 bottom-[2px] h-0.5 w-4 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? '-translate-y-[5px] -rotate-45' : ''
          }`}
        />
      </span>
    </button>
  );
}
