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
      <span
        aria-hidden="true"
        className={`flex size-5 items-center justify-center gap-[3px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'rotate-90' : 'rotate-0'}`}
      >
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={`size-1 rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open && dot === 1
                ? 'scale-125'
                : open
                  ? 'translate-y-1'
                  : ''
            }`}
          />
        ))}
      </span>
    </button>
  );
}
