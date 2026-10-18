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
      className="grid size-10 shrink-0 place-items-center rounded-full bg-transparent text-foreground transition-transform duration-300 active:scale-90 motion-reduce:transition-none"
    >
      <span aria-hidden="true" className="relative size-5">
        <span
          className={`absolute start-0 top-[3px] h-[2px] rounded-full bg-current transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'w-3.5 translate-x-1' : 'w-5'}`}
        />
        <span
          className={`absolute start-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-current transition-[width,transform] duration-500 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'w-5' : 'w-3.5'}`}
        />
        <span
          className={`absolute start-0 bottom-[3px] h-[2px] rounded-full bg-current transition-[width,transform] duration-500 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'w-3.5 translate-x-1' : 'w-5'}`}
        />
      </span>
    </button>
  );
}
