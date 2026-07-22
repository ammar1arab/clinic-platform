'use client';

import { BrandMark, LoadingDots } from './brand-mark';
import { cn } from '@/lib/utils';

interface Props {
  label?: string;
  className?: string;
  variant?: 'fullscreen' | 'panel';
}

/**
 * Boot / route loading surface.
 * Shared by root, auth, dashboard `loading.tsx`, and auth session restore.
 */
export function BootSplash({
  label = 'Preparing your clinic…',
  className,
  variant = 'fullscreen',
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'relative flex flex-col items-center justify-center bg-background',
        variant === 'fullscreen' ? 'fixed inset-0 z-200' : 'min-h-[50vh] w-full',
        className,
      )}
    >
      <div className="relative flex flex-col items-center gap-4 px-6 py-6">
        <BrandMark size="lg" spinning />

        <div className="text-center">
          <p className="font-heading text-base font-semibold tracking-tight">
            Clinic <span className="text-primary">Platform</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>

        <LoadingDots />
      </div>
    </div>
  );
}
