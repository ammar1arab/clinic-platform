'use client';

import Image from 'next/image';
import { useId } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { BRAND_MARK_SRC } from '@/constants/brand';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const dims: Record<Size, { box: string; px: number }> = {
  sm: { box: 'size-8', px: 32 },
  md: { box: 'size-12', px: 48 },
  lg: { box: 'size-16', px: 64 },
};

export function BrandMark({
  className,
  size = 'md',
  spinning = false,
}: {
  className?: string;
  size?: Size;
  spinning?: boolean;
}) {
  const { t } = useLanguage();
  const gradientId = useId();
  const { box, px } = dims[size];

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', box, className)}
      aria-label={t.layout.titles.default}
      role="img"
    >
      {spinning && (
        <>
          <span className="absolute inset-0 rounded-full border border-primary/15 animate-clinic-ripple" aria-hidden />
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full animate-clinic-orbit" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="5" y1="5" x2="43" y2="43">
                <stop stopColor="var(--primary)" />
                <stop offset=".52" stopColor="var(--accent-teal)" />
                <stop offset="1" stopColor="var(--warning)" />
              </linearGradient>
            </defs>
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="48 84"
            />
          </svg>
          <span className="absolute start-1/2 top-0 size-2 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-accent-teal animate-clinic-spark" aria-hidden />
        </>
      )}

      <Image
        src={BRAND_MARK_SRC}
        alt=""
        width={px}
        height={px}
        priority
        className={cn(
          'relative size-full object-contain',
          spinning && 'animate-clinic-breathe',
        )}
      />
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={t.common.loading}
      role="status"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cn(
            'size-1.5 rounded-full animate-clinic-dot',
            dot === 0 && 'bg-primary',
            dot === 1 && 'bg-accent-teal',
            dot === 2 && 'bg-warning',
          )}
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </span>
  );
}
