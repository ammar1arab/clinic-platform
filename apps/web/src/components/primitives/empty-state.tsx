import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/constants/icons';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-1 rounded-full bg-muted p-3">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
