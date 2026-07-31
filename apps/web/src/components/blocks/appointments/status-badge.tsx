import { cn } from '@/lib/utils';
import { AppointmentStatus } from '@/services/appointments.service';

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; short: string; className: string; dotClassName: string }
> = {
  unconfirmed: {
    label: 'Unconfirmed',
    short: 'Unconf.',
    className: 'bg-warning/12 text-warning border-warning/20',
    dotClassName: 'bg-warning',
  },
  confirmed: {
    label: 'Confirmed',
    short: 'Ok',
    className: 'bg-success/12 text-success border-success/20',
    dotClassName: 'bg-success',
  },
  checked_in: {
    label: 'Checked In',
    short: 'In',
    className: 'bg-success/12 text-success border-success/20',
    dotClassName: 'bg-success',
  },
  waiting: {
    label: 'Waiting',
    short: 'Wait',
    className: 'bg-warning/12 text-warning border-warning/20',
    dotClassName: 'bg-warning',
  },
  in_progress: {
    label: 'In Progress',
    short: 'Live',
    className: 'bg-primary/12 text-primary border-primary/20',
    dotClassName: 'bg-primary animate-pulse',
  },
  completed: {
    label: 'Completed',
    short: 'Done',
    className: 'bg-primary/12 text-primary border-primary/20',
    dotClassName: 'bg-primary',
  },
  no_show: {
    label: 'No Show',
    short: 'No',
    className: 'bg-error/12 text-error border-error/20',
    dotClassName: 'bg-error',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'X',
    className: 'bg-muted text-muted-foreground border-border',
    dotClassName: 'bg-muted-foreground',
  },
};

interface Props {
  status: AppointmentStatus;
  className?: string;

  compact?: boolean;
}



export function StatusBadgeBlock({ status, className, compact }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      title={config.label}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
        config.className,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClassName)} />
      {compact ? (
        <span className="truncate">{config.short}</span>
      ) : (
        <>
          <span className="truncate sm:hidden">{config.short}</span>
          <span className="hidden truncate sm:inline">{config.label}</span>
        </>
      )}
    </span>
  );
}
