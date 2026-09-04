import { IconWell } from '@/components/primitives';
import { Button } from '@/components/ui';
import type { LucideIcon } from '@/constants/icons';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Props = React.ComponentPropsWithoutRef<typeof Button> & {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const ReportCard = forwardRef<HTMLButtonElement, Props>(
  ({ icon, title, description, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          'card-aura group h-auto flex-col items-start gap-4 rounded-xl p-4 text-start whitespace-normal transition-all duration-200 hover:ring-2 hover:ring-ring sm:p-5',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <IconWell icon={icon} size="md" accent="default" />
          <div className="min-w-0 pt-0.5">
            <h2 className="text-sm font-semibold leading-none">{title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground/80">
              {description}
            </p>
          </div>
        </div>
      </Button>
    );
  }
);
ReportCard.displayName = 'ReportCard';
