'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui';
import { STATUS_COLORS } from './status-badge';
import {
  Appointment,
  AppointmentStatus,
  computePayable,
} from '@/services/appointments.service';
import {
  formatApptTimeRange,
  formatDoctorLabel,
  patientDisplayName,
} from './appointment-display';
import { type AnchorRect, clickAnchor } from './popover-position';
import { formatWaitingMins, resolveWaitingMins } from '@/lib/waiting-time';
import { AppointmentStatusSelect } from './appointment-status-select';
import { useNow } from '@/hooks/shared/use-now';
import { useMounted } from '@/hooks/shared/use-mounted';
import { IconClose, IconMaximize, IconOnline, IconPerson, IconRoom, IconService, IconTime } from '@/constants/icons';
import { SoftTip } from '@/components/primitives';
import {
  holdCalendarMorePopover,
  isProtectedOverlayTarget,
  overlayEventTarget,
  stopNativeOverlayEvent,
} from '@/lib/overlay';

export interface EventPreviewState {
  appointment: Appointment;
  x: number;
  y: number;
  anchor?: AnchorRect;
}


export type PreviewPlacement = 'horizontal' | 'vertical' | 'auto';

interface Props {
  preview: EventPreviewState;
  placement?: PreviewPlacement;
  onClose: () => void;
  onExpand: (appointment: Appointment) => void;
}

type PreviewSide = 'top' | 'bottom' | 'left' | 'right';

const MOBILE_MAX_WIDTH = 768;

function resolvePreviewSide(
  x: number,
  y: number,
  placement: PreviewPlacement,
): PreviewSide {
  if (typeof window === 'undefined') {
    return placement === 'horizontal' ? 'right' : 'bottom';
  }

  const { innerWidth: vw, innerHeight: vh } = window;
  const mobile = vw < MOBILE_MAX_WIDTH;

  if (mobile || placement === 'vertical') {
    return y > vh * 0.55 ? 'top' : 'bottom';
  }

  if (placement === 'horizontal') {
    return x > vw * 0.5 ? 'left' : 'right';
  }

  const space = {
    right: vw - x,
    left: x,
    bottom: vh - y,
    top: y,
  } as const;

  return (Object.entries(space) as [PreviewSide, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
}

function formatDayLabel(appt: Appointment) {
  return new Date(appt.scheduledAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function EventPreview({
  preview,
  placement = 'horizontal',
  onClose,
  onExpand,
}: Props) {
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

  const anchorRect = useMemo(
    () => clickAnchor(preview.x, preview.y, preview.anchor),
    [preview.x, preview.y, preview.anchor],
  );

  const side = useMemo(
    () => resolvePreviewSide(preview.x, preview.y, placement),
    [preview.x, preview.y, placement],
  );

  if (!mounted) return null;

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modal={false}
    >
      <PopoverAnchor asChild>
        <div
          aria-hidden
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
        ref={holdCalendarMorePopover}
        side={side}
        align="center"
        sideOffset={10}
        avoidCollisions
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          const target = overlayEventTarget(event);
          if (isProtectedOverlayTarget(target)) {
            event.preventDefault();
            return;
          }
          stopNativeOverlayEvent(event);
          onClose();
        }}
        onFocusOutside={(event) => {
          const originalEvent = event.detail.originalEvent;
          if (
            originalEvent instanceof FocusEvent &&
            isProtectedOverlayTarget(originalEvent.relatedTarget)
          ) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={onClose}
        className="z-110 flex w-[min(calc(100vw-1rem),20rem)] max-h-[min(var(--radix-popover-content-available-height),calc(100dvh-1rem),28rem)] flex-col overflow-hidden p-0"
        data-calendar-popover="preview"
      >
        <div
          className="h-1 w-full shrink-0"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/60 px-3.5 py-3">
          <div className="min-w-0">
            <SoftTip label={patientDisplayName(appt)}>
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {patientDisplayName(appt)}
              </p>
            </SoftTip>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDayLabel(appt)} · {formatApptTimeRange(appt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <AppointmentStatusSelect
              appointment={{ ...appt, status: currentStatus }}
              onStatusChange={setCurrentStatus}
            />
            <SoftTip label="Close preview">
              <button
                type="button"
                aria-label="Close preview"
                onClick={onClose}
                className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95"
              >
                <IconClose className="size-3.5" />
              </button>
            </SoftTip>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3.5">
          <div className="space-y-2.5 rounded-lg border bg-muted/30 p-2.5 text-xs">
            <Row
              icon={<IconPerson className="size-3.5" />}
              label="Doctor"
              value={formatDoctorLabel(appt.doctor?.name)}
            />
            {appt.service ? (
              <Row
                icon={<IconService className="size-3.5" />}
                label="Service"
                value={appt.service.name}
              />
            ) : null}
            {appt.sessionType === 'online' ? (
              <Row
                icon={<IconOnline className="size-3.5" />}
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
            ) : appt.room ? (
              <Row icon={<IconRoom className="size-3.5" />} label="Room" value={appt.room.name} />
            ) : null}
            <Row
              icon={<IconTime className="size-3.5" />}
              label="Details"
              value={`${appt.durationMins} min · ${pricing.payable.toFixed(3)} JOD`}
            />
            {waitingMins != null ? (
              <Row
                icon={<IconTime className="size-3.5" />}
                label="Waiting time"
                value={formatWaitingMins(waitingMins)}
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-3.5 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => onExpand({ ...appt, status: currentStatus })}
            className="active:scale-95"
          >
            <IconMaximize className="mr-1.5 size-3.5" />
            Open appointment
          </Button>
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
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  const title = typeof value === 'string' ? value : undefined;
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-background text-muted-foreground shadow-2xs">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <SoftTip label={title}>
          <p className="truncate font-medium text-foreground">
            {value}
          </p>
        </SoftTip>
      </div>
    </div>
  );
}
