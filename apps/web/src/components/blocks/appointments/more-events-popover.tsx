'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Appointment } from '@/services/appointments.service';
import { STATUS_COLORS } from './status-colors';
import { formatApptStartAmPm, patientDisplayName } from './calendar-time';
import { clickAnchor, type AnchorRect } from './popover-position';
import { useMounted } from '@/hooks/use-mounted';

export interface MoreEventsState {
  date: Date;
  appointments: Appointment[];
  x: number;
  y: number;
  anchor?: AnchorRect;
}

interface Props {
  state: MoreEventsState;
  onClose: () => void;
  onSelect: (appointment: Appointment, x: number, y: number, anchor?: AnchorRect) => void;
}

export function MoreEventsPopover({ state, onClose, onSelect }: Props) {
  const mounted = useMounted();

  const anchorRect = useMemo(() => {
    return clickAnchor(state.x, state.y, state.anchor);
  }, [state.x, state.y, state.anchor]);

  const dateLabel = useMemo(() => {
    return state.date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [state.date]);

  if (!mounted) return null;

  return (
    <Popover
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modal={false}
    >
      <PopoverAnchor asChild>
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: Math.max(0, anchorRect.left),
            top: Math.max(0, anchorRect.top),
            width: Math.max(1, anchorRect.width),
            height: Math.max(1, anchorRect.height),
            pointerEvents: 'none',
            zIndex: 90,
          }}
        />
      </PopoverAnchor>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        avoidCollisions={true}
        collisionPadding={16}
        onPointerDownOutside={(e) => {
          // Stay open when clicking inside the event preview
          const target = e.target as HTMLElement | null;
          if (target?.closest('[data-calendar-popover="preview"]')) {
            e.preventDefault();
            return;
          }
          onClose();
        }}
        onFocusOutside={(e) => {
          // Prevent focus stealing by EventPreview from closing this
          e.preventDefault();
        }}
        onEscapeKeyDown={onClose}
        className="w-[min(calc(100vw-2rem),280px)] p-0 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 z-[100]"
        data-calendar-popover="more"
      >
        <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/20">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-tight text-foreground">{dateLabel}</p>
            <p className="text-[10px] text-muted-foreground">
              {state.appointments.length} appointment
              {state.appointments.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="max-h-[min(55vh,18rem)] space-y-1.5 overflow-y-auto overscroll-contain p-2">
          {state.appointments.map((appt) => {
            const color = STATUS_COLORS[appt.status];
            return (
              <button
                key={appt.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  onSelect(appt, e.clientX, e.clientY, {
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height,
                  });
                }}
                className="group flex w-full items-center gap-2 rounded-lg border border-transparent p-2 text-left text-xs transition-all duration-150 hover:border-border/80 hover:bg-muted/70 cursor-pointer active:scale-[0.98]"
              >
                <span
                  className="size-2 shrink-0 rounded-full transition-transform duration-150 group-hover:scale-125 shadow-xs"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {patientDisplayName(appt)}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {formatApptStartAmPm(appt)} · {appt.doctor.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
