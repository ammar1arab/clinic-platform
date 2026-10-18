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
      <span aria-hidden="true" className="relative size-5">
        <span
          className={`absolute start-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary transition-[transform,opacity,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? 'translate-x-1.5 -translate-y-[9px] scale-75 opacity-70' : 'group-hover:translate-x-0.5'
          }`}
        />
        <span
          className={`absolute start-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-teal transition-[transform,opacity,background-color] duration-300 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? 'scale-125 bg-primary' : 'group-hover:scale-125'
          }`}
        />
        <span
          className={`absolute end-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary transition-[transform,opacity,background-color] duration-300 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? '-translate-x-1.5 translate-y-[6px] scale-75 opacity-70' : 'group-hover:-translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
