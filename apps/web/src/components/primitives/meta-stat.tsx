import { cn } from '@/lib/utils';

export function MetaStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate font-medium">{value}</p>
    </div>
  );
}
