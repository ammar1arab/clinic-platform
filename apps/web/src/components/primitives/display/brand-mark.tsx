'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const dims: Record<Size, string> = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
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
  const gradientId = useId();

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        dims[size],
        className,
      )}
    >
      {spinning && (
        <>
          <span className="absolute inset-0 rounded-full border border-primary/15 animate-clinic-ripple" />
          <svg
            viewBox="0 0 48 48"
            className="absolute inset-0 size-full animate-clinic-orbit"
            aria-hidden
          >
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
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-accent-teal animate-clinic-spark" />
        </>
      )}

      <span
        className={cn(
          'flex items-center justify-center rounded-xl bg-linear-to-br from-primary via-primary to-accent-teal text-primary-foreground',
          spinning ? 'size-[58%]' : 'size-[62%]',
          spinning && 'animate-clinic-breathe shadow-md shadow-primary/20',
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-[55%]" aria-hidden>
          <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label="Loading"
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
