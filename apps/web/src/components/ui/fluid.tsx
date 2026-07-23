import { cn } from '@/lib/utils';

/** Moving brand gradient layer — place inside a relative/overflow-hidden parent. */
export function FluidWave({ className }: { className?: string }) {
  return <span aria-hidden className={cn('fluid-wave', className)} />;
}

type FluidSurfaceProps = React.ComponentProps<'div'> & {
  /** Softer wash for large empty loaders (SectionLoader / BootSplash). */
  ambient?: boolean;
};

/**
 * Shared fluid loading surface.
 * Use for skeleton boxes, card placeholders, and branded waiting states.
 */
export function FluidSurface({
  className,
  ambient = false,
  children,
  ...props
}: FluidSurfaceProps) {
  if (ambient) {
    return (
      <div className={cn('relative', className)} {...props}>
        <div className="fluid-ambient" aria-hidden>
          <FluidWave />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('fluid-surface', className)} {...props}>
      <FluidWave />
      {children}
    </div>
  );
}

/** Stack of fluid skeleton cards for list/table loading. */
export function FluidSkeletonStack({
  count = 4,
  className,
  itemClassName,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn('fluid-surface h-16 w-full rounded-xl', itemClassName)}
        >
          <FluidWave />
        </div>
      ))}
    </div>
  );
}
