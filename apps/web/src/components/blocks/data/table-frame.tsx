import { cn } from '@/lib/utils';

/**
 * Consistent bordered frame around data tables.
 * Keeps overflow on the shared Table container (no double scrollbars).
 */
export function TableFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card-aura overflow-hidden rounded-xl border-0 bg-card', className)}>
      {children}
    </div>
  );
}
