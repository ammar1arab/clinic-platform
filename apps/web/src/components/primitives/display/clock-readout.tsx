import { cn } from '@/lib/utils';

export function ClockReadout({ main, minor, suffix, className, minorClassName }: { main: string; minor?: string; suffix?: string; className?: string; minorClassName?: string }) {
  return (
    <span dir="ltr" className={cn('inline-flex items-baseline gap-0.5 whitespace-nowrap tabular-nums', className)}>
      <span>{main}</span>
      {minor ? <span className={cn('text-muted-foreground', minorClassName)}>{minor}</span> : null}
      {suffix ? <span className="ms-1">{suffix}</span> : null}
    </span>
  );
}
