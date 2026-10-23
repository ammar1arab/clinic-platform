import { Badge, type BadgeVariant } from '@/components/ui';
import { cn } from '@/lib/utils';

export function CountBadge({
  count,
  variant = 'info',
  className,
}: {
  count: number;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <Badge variant={variant} className={cn('h-5 min-w-5 px-1.5 tabular-nums', className)}>
      {count}
    </Badge>
  );
}
