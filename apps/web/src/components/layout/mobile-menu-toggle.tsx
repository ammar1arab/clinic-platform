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
  const label = open ? t.layout.sideMenu.close : t.layout.sideMenu.open;

  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls="mobile-side-menu"
      onClick={onClick}
      className="group relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/80 bg-card/80 text-foreground shadow-sm transition-[transform,box-shadow,border-color] duration-300 active:scale-90 motion-reduce:transition-none md:hover:border-primary/35 md:hover:shadow-[0_8px_24px_-14px_hsl(var(--primary)/.7)]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-accent-teal/10 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      <span aria-hidden="true" className="relative grid size-5 place-items-center">
        <span
          className={`absolute start-0 top-[3px] h-[2px] w-5 origin-center rounded-full bg-current transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? 'translate-y-[6px] rotate-45 bg-primary' : 'group-hover:translate-x-0.5'
          }`}
        />
        <span
          className={`absolute start-0 top-1/2 h-[2px] w-3.5 -translate-y-1/2 rounded-full bg-current transition-[opacity,transform,width] duration-200 ease-out motion-reduce:transition-none ${
            open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100 group-hover:w-5'
          }`}
        />
        <span
          className={`absolute start-0 bottom-[3px] h-[2px] w-5 origin-center rounded-full bg-current transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? '-translate-y-[6px] -rotate-45 bg-primary' : 'group-hover:translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
