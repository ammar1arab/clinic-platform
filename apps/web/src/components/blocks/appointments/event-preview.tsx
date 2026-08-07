'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  DoorOpen,
  Maximize2,
  Stethoscope,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { STATUS_COLORS } from './status-colors';
import { Appointment, AppointmentStatus, computePayable } from '@/services/appointments.service';
import { formatApptTimeRange, patientDisplayName } from './calendar-time';
import { type AnchorRect, clickAnchor } from './popover-position';
import { formatWaitingMins, resolveWaitingMins } from '@/lib/waiting-time';
import { AppointmentStatusSelect } from './appointment-status-select';
import { useNow } from '@/hooks/use-now';
import { useMounted } from '@/hooks/use-mounted';

export interface EventPreviewState {
  appointment: Appointment;
  x: number;
  y: number;
  anchor?: AnchorRect;
}

interface Props {
  preview: EventPreviewState;
  onClose: () => void;
  onExpand: (appointment: Appointment) => void;
}

function formatDayLabel(appt: Appointment) {
  const start = new Date(appt.scheduledAt);
  return start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function EventPreview({ preview, onClose, onExpand }: Props) {
  const { appointment: appt } = preview;
  const mounted = useMounted();
  const now = useNow(30_000);
  const [currentStatus, setCurrentStatus] = useState<AppointmentStatus>(appt.status);

  const [prevApptKey, setPrevApptKey] = useState(`${appt.id}:${appt.status}`);
  if (prevApptKey !== `${appt.id}:${appt.status}`) {
    setPrevApptKey(`${appt.id}:${appt.status}`);
    setCurrentStatus(appt.status);
  }

  const pricing = useMemo(
    () => computePayable(appt.fee, appt.discount, appt.discountType),
    [appt.fee, appt.discount, appt.discountType],
  );
  const accent = STATUS_COLORS[currentStatus];
  const waitingMins = resolveWaitingMins({ ...appt, status: currentStatus, now });

  const anchorRect = useMemo(() => {
    return clickAnchor(preview.x, preview.y, preview.anchor);
  }, [preview.x, preview.y, preview.anchor]);

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
        side="right"
        align="center"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('[data-calendar-popover="more"]')) {
            return;
          }
          onClose();
        }}
        onEscapeKeyDown={onClose}
        className="w-[min(calc(100vw-2rem),310px)] p-0 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 z-[110]"
      >
        <div
          className="h-1 w-full transition-colors duration-200"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <div className="max-h-[min(75vh,26rem)] overflow-y-auto overscroll-contain p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {patientDisplayName(appt)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDayLabel(appt)} · {formatApptTimeRange(appt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <AppointmentStatusSelect
                appointment={{ ...appt, status: currentStatus }}
                onStatusChange={(next) => setCurrentStatus(next)}
              />

              <button
                type="button"
                aria-label="Close preview"
                onClick={onClose}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5 text-xs">
            <Row icon={<UserRound className="size-3.5" />} label="Doctor" value={appt.doctor.name} />
            {appt.service && (
              <Row
                icon={<Stethoscope className="size-3.5" />}
                label="Service"
                value={appt.service.name}
              />
            )}
            {appt.sessionType === 'online' ? (
              <Row
                icon={<Video className="size-3.5" />}
                label="Session"
                value={
                  appt.meetingUrl ? (
                    <a
                      href={appt.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-primary underline-offset-2 hover:underline"
                    >
                      Join online session
                    </a>
                  ) : (
                    'Online session'
                  )
                }
              />
            ) : (
              appt.room && (
                <Row icon={<DoorOpen className="size-3.5" />} label="Room" value={appt.room.name} />
              )
            )}
            <Row
              icon={<Clock className="size-3.5" />}
              label="Details"
              value={`${appt.durationMins} min · ${pricing.payable.toFixed(3)} JOD`}
            />
            {waitingMins != null && (
              <Row
                icon={<Clock className="size-3.5" />}
                label="Waiting time"
                value={formatWaitingMins(waitingMins)}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} className="transition-all hover:bg-muted">
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => onExpand({ ...appt, status: currentStatus })}
              className="transition-all hover:shadow-md active:scale-95"
            >
              <Maximize2 className="mr-1.5 size-3.5" />
              Open appointment
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-background text-muted-foreground shadow-2xs">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
        <p className="truncate text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}
