'use client';

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/services/appointments.service';
import { clickAnchor, type AnchorRect } from './popover-position';
import { formatApptStartAmPm, patientDisplayName } from './appointment-display';
import { StatusBadgeBlock } from './status-badge';

export type CalendarMoreState = {
  date: Date;
  appointments: Appointment[];
  x: number;
  y: number;
  anchor: AnchorRect;
};

export function CalendarMoreList({
  state,
  onClose,
  onSelect,
}: {
  state: CalendarMoreState;
  onClose: () => void;
  onSelect: (appointment: Appointment) => void;
}) {
  const anchor = clickAnchor(state.x, state.y, state.anchor);
  const count = state.appointments.length;

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <PopoverAnchor asChild>
        <div
          aria-hidden
          className="pointer-events-none fixed z-110 size-px"
          style={{
            left: Math.max(0, anchor.left),
            top: Math.max(0, anchor.top),
            width: Math.max(1, state.anchor.width),
            height: Math.max(1, state.anchor.height),
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="z-110 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden border-border bg-popover p-0 text-popover-foreground"
        data-calendar-popover="more"
      >
        <div className="border-b border-border px-3.5 py-2.5">
          <p className="text-sm font-semibold text-foreground">
            {state.date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {count} appointment{count === 1 ? '' : 's'}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {state.appointments.map((appt) => (
            <button
              key={appt.id}
              type="button"
              onClick={() => onSelect(appt)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left',
                'hover:bg-muted focus-visible:bg-muted focus-visible:ring-1 focus-visible:ring-ring',
              )}
            >
              <span className="w-14 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {formatApptStartAmPm(appt)}
              </span>
              <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">
                {patientDisplayName(appt)}
              </span>
              <StatusBadgeBlock status={appt.status} compact tip={false} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
