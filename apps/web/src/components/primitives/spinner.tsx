import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark, LoadingDots } from '@/components/blocks/feedback/brand-mark';

const sizeMap = {
  sm: 'size-4',
  default: 'size-5',
  lg: 'size-6',
} as const;

/** Inline spinner for tight UI (table cells, tiny badges). */
export function Spinner({
  size = 'default',
  className,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeMap[size], className)}
      aria-hidden
    />
  );
}

/** Centered section loading — use inside cards, tables, detail panes. */
export function SectionLoader({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-14', className)}
      role="status"
      aria-live="polite"
    >
      <BrandMark size="md" spinning />
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <LoadingDots />
      </div>
    </div>
  );
}

export { EmptyState } from './empty-state';
