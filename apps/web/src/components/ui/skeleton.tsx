import { cn } from '@/lib/utils';
import { FluidWave } from '@/components/ui/fluid';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('fluid-surface rounded-md', className)}
      {...props}
    >
      <FluidWave />
    </div>
  );
}

export { Skeleton };
