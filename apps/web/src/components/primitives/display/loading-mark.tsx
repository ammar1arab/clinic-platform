'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useClinicLogo } from '@/hooks/api/use-clinic';
import { useLanguage } from '@/providers/language-provider';

const DOTS = 12;
const RADIUS = 22;
const SPAN = 52;
const PULSE = [0, 0, 0, -4, 0, -16, 12, 0, -6, 0, 0, 0];

const dots = Array.from({ length: DOTS }, (_, index) => {
  const angle = (index / DOTS) * Math.PI * 2 - Math.PI / 2;
  return {
    index,
    cx: Number((Math.cos(angle) * RADIUS).toFixed(2)),
    cy: Number((Math.sin(angle) * RADIUS).toFixed(2)),
    lx: Number((-SPAN / 2 + (index * SPAN) / (DOTS - 1)).toFixed(2)),
    ly: PULSE[index],
  };
});

export function LoadingMark({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const { t } = useLanguage();
  const logoUrl = useClinicLogo();
  const box = size === 'lg' ? 'size-20' : 'size-14';

  return (
    <span role="status" aria-label={t.common.loading} className={cn('relative grid shrink-0 place-items-center text-primary', box, className)}>
      <svg viewBox="-36 -36 72 72" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {dots.map((dot) => (
          <circle
            key={dot.index}
            r="3"
            fill="currentColor"
            className="loader-dot"
            style={{ '--i': dot.index, '--cx': `${dot.cx}px`, '--cy': `${dot.cy}px`, '--lx': `${dot.lx}px`, '--ly': `${dot.ly}px` } as CSSProperties}
          />
        ))}
      </svg>
      {logoUrl ? (
        <Image key={logoUrl} src={logoUrl} alt="" width={40} height={40} unoptimized priority className="loader-logo relative size-[42%] object-contain" />
      ) : null}
    </span>
  );
}
