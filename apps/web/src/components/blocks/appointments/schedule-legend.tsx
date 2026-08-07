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
      className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0"
    >
      <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">
        Status:
      </span>

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
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
              active
                ? cn(config.className, 'shadow-xs ring-1 ring-primary/30')
                : filtering
                  ? 'border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  : 'border-border/60 bg-card/80 text-foreground/80 hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] }}
              aria-hidden
            />
            {item.label}
          </button>
        );
      })}

      {filtering && (
        <button
          type="button"
          onClick={() => {
            for (const status of Array.from(activeStatuses)) {
              onToggleStatus(status);
            }
          }}
          className="inline-flex shrink-0 items-center rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all cursor-pointer active:scale-95"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
