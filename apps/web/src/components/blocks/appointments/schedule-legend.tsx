'use client';

import { AppointmentStatus } from '@/services/appointments.service';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from './status-colors';
import { STATUS_CONFIG } from './status-badge';

const LEGEND_ITEMS: { status: AppointmentStatus; label: string }[] = [
  { status: 'unconfirmed', label: 'Unconfirmed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
  { status: 'no_show', label: 'No show' },
  { status: 'cancelled', label: 'Cancelled' },
];

interface Props {

  activeStatuses: Set<AppointmentStatus>;
  onToggleStatus: (status: AppointmentStatus) => void;
}

export function ScheduleLegend({ activeStatuses, onToggleStatus }: Props) {
  const filtering = activeStatuses.size > 0;

  return (
    <div
      role="group"
      aria-label="Filter by appointment status"
      className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0"
    >
      {LEGEND_ITEMS.map((item) => {
        const active = activeStatuses.has(item.status);
        const config = STATUS_CONFIG[item.status];
        return (
          <button
            key={item.status}
            type="button"
            aria-pressed={active}
            onClick={() => onToggleStatus(item.status)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
              active
                ? cn(config.className, 'shadow-sm')
                : filtering
                  ? 'border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  : 'border-border/80 bg-card text-foreground/75 hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] }}
              aria-hidden
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
