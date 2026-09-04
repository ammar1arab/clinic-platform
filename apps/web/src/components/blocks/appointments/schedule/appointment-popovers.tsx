'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Popover, PopoverAnchor, PopoverContent } from '@/components/ui';
import { SoftTip } from '@/components/primitives';
import {
  IconClose,
  IconMaximize,
  IconOnline,
  IconPerson,
  IconRoom,
  IconService,
  IconTime,
} from '@/constants/icons';
import { useNow } from '@/hooks/shared/use-now';
import { getBilingualName } from '@/i18n';
import { keepNestedPortals } from '@/lib/overlay';
import { formatClinicAmount } from '@/lib/package-balance';
import { cn } from '@/lib/utils';
import { formatWaitingMins, resolveWaitingMins } from '@/lib/waiting-time';
import { useLanguage } from '@/providers';
import {
  type Appointment,
  type AppointmentStatus,
  computePayable,
} from '@/services/appointments.service';
import {
  formatApptTimeRange,
  formatDoctorLabel,
  patientDisplayName,
} from '../shared/appointment-display';
import { AppointmentStatusSelect } from '../shared/appointment-status-select';
import { STATUS_COLORS, StatusBadgeBlock } from '../shared/status-badge';

export type PopoverAnchorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AppointmentPopoverState = {
  appointment: Appointment;
  anchor: PopoverAnchorRect;
};

export type DayAppointmentsPopoverState = {
  date: Date;
  appointments: Appointment[];
  anchor: PopoverAnchorRect;
};

export type CalendarPopoverPlacement = 'month' | 'vertical';

export function popoverAnchorFromElement(element: Element): PopoverAnchorRect {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function FixedAnchor({ anchor }: { anchor: PopoverAnchorRect }) {
  return (
    <PopoverAnchor asChild>
      <span
        aria-hidden
        className="pointer-events-none fixed z-90 block"
        style={{
          left: anchor.left,
          top: anchor.top,
          width: Math.max(anchor.width, 1),
          height: Math.max(anchor.height, 1),
        }}
      />
    </PopoverAnchor>
  );
}

function formatDay(value: Date | string, lang: string) {
  return new Date(value).toLocaleDateString(lang, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function preferredSide(
  anchor: PopoverAnchorRect,
  placement: CalendarPopoverPlacement,
): 'top' | 'bottom' | 'left' | 'right' {
  if (typeof window === 'undefined') return 'bottom';
  const gap = 16;
  const spaceAbove = Math.max(0, anchor.top - gap);
  const spaceBelow = Math.max(0, window.innerHeight - anchor.top - anchor.height - gap);
  const spaceStart = Math.max(0, anchor.left - gap);
  const spaceEnd = Math.max(0, window.innerWidth - anchor.left - anchor.width - gap);
  const isMobile = window.innerWidth < 768;

  if (placement === 'month' && !isMobile) {
    return spaceStart >= spaceEnd ? 'left' : 'right';
  }

  return spaceAbove >= spaceBelow ? 'top' : 'bottom';
}

const POPOVER_SURFACE =
  'z-110 w-[min(calc(100vw-1.5rem),24rem)] max-h-[min(var(--radix-popover-content-available-height),calc(100dvh-1.5rem))] overflow-y-auto overscroll-contain p-0';

export function DayAppointmentsPopover({
  state,
  onClose,
  onSelect,
}: {
  state: DayAppointmentsPopoverState;
  onClose: () => void;
  onSelect: (appointment: Appointment, anchor: PopoverAnchorRect) => void;
}) {
  const { t, lang } = useLanguage();
  const side = preferredSide(state.anchor, 'vertical');

  const sorted = useMemo(
    () =>
      [...state.appointments].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [state.appointments],
  );

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <FixedAnchor anchor={state.anchor} />
      <PopoverContent
        data-calendar-popover="more"
        align="center"
        side={side}
        sideOffset={10}
        collisionPadding={16}
        onInteractOutside={keepNestedPortals}
        className={POPOVER_SURFACE}
      >
        <div className="flex items-start justify-between gap-3 border-b px-3 py-2.5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {formatDay(state.date, lang)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {sorted.length} {t.appointments.appts}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t.common.close}
            className="shrink-0"
          >
            <IconClose />
          </Button>
        </div>
        <div className="max-h-[min(55dvh,28rem)] overflow-y-auto overscroll-contain p-1.5">
          {sorted.length ? (
            sorted.map((appointment) => {
              const accent = STATUS_COLORS[appointment.status];
              const doctor = formatDoctorLabel(appointment.doctor, { lang });
              const service = appointment.service
                ? getBilingualName(appointment.service.name, appointment.service.nameAr, lang)
                : null;
              const room =
                appointment.sessionType === 'online'
                  ? t.appointments.online
                  : appointment.room
                    ? getBilingualName(appointment.room.name, appointment.room.nameAr, lang)
                    : null;

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={(event) =>
                    onSelect(appointment, popoverAnchorFromElement(event.currentTarget))
                  }
                  className={cn(
                    'flex w-full gap-2.5 rounded-lg border border-transparent px-2 py-2 text-start outline-none',
                    'transition-[background-color,border-color,box-shadow] hover:border-border hover:bg-muted/70',
                    'focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  style={{
                    borderInlineStartWidth: 3,
                    borderInlineStartColor: accent,
                  }}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {patientDisplayName(appointment, lang)}
                      </span>
                      <StatusBadgeBlock status={appointment.status} compact tip={false} />
                    </div>
                    <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                      {formatApptTimeRange(appointment, lang)}
                      <span className="mx-1 text-border">·</span>
                      {appointment.durationMins} {t.appointments.minutesShort}
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1 truncate">
                        <IconPerson className="size-2.5 shrink-0 text-primary" />
                        <span className="truncate">{doctor}</span>
                      </span>
                      {room ? (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-1 truncate">
                          {appointment.sessionType === 'online' ? (
                            <IconOnline className="size-2.5 shrink-0 text-primary" />
                          ) : (
                            <IconRoom className="size-2.5 shrink-0" />
                          )}
                          <span className="truncate">{room}</span>
                        </span>
                      ) : null}
                      {service ? (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-1 truncate">
                          <IconService className="size-2.5 shrink-0 text-primary" />
                          <span className="truncate">{service}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t.appointments.noAppointmentsFound}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppointmentPopover({
  state,
  onClose,
  onExpand,
  placement = 'vertical',
}: {
  state: AppointmentPopoverState;
  onClose: () => void;
  onExpand: (appointment: Appointment) => void;
  placement?: CalendarPopoverPlacement;
}) {
  const { t, lang } = useLanguage();
  const now = useNow(30_000);
  const appointment = state.appointment;
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const pricing = computePayable(
    appointment.fee,
    appointment.discount,
    appointment.discountType,
  );
  const waitingMins = resolveWaitingMins({ ...appointment, status, now });
  const accent = STATUS_COLORS[status];
  const title = patientDisplayName(appointment, lang);
  const side = preferredSide(state.anchor, placement);

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <FixedAnchor anchor={state.anchor} />
      <PopoverContent
        data-calendar-popover="appointment"
        aria-label={title}
        side={side}
        align="center"
        sideOffset={10}
        collisionPadding={16}
        onInteractOutside={keepNestedPortals}
        className={POPOVER_SURFACE}
      >
        <div className="h-1" style={{ backgroundColor: accent }} aria-hidden />
        <div className="border-b px-3 py-2.5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <SoftTip label={title}>
                <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
              </SoftTip>
              <p className="text-xs text-muted-foreground">
                {formatDay(appointment.scheduledAt, lang)} ·{' '}
                {formatApptTimeRange(appointment, lang)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={t.common.close}
              className="shrink-0"
            >
              <IconClose />
            </Button>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {t.appointments.status}
            </span>
            <AppointmentStatusSelect
              appointment={{ ...appointment, status }}
              onStatusChange={setStatus}
            />
          </div>
        </div>

        <div className="max-h-[min(52dvh,22rem)] overflow-y-auto overscroll-contain p-3">
          <div className="space-y-2.5 rounded-xl border bg-muted/30 p-3 text-xs">
            <DetailRow
              icon={<IconPerson />}
              label={t.appointments.doctor}
              value={formatDoctorLabel(appointment.doctor, { lang })}
            />
            {appointment.service ? (
              <DetailRow
                icon={<IconService />}
                label={t.appointments.service}
                value={getBilingualName(
                  appointment.service.name,
                  appointment.service.nameAr,
                  lang,
                )}
              />
            ) : null}
            {appointment.sessionType === 'online' ? (
              <DetailRow
                icon={<IconOnline />}
                label={t.appointments.sessionType}
                value={
                  appointment.meetingUrl ? (
                    <a
                      href={appointment.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-words text-primary underline-offset-2 hover:underline"
                    >
                      {t.appointments.joinOnlineSession}
                    </a>
                  ) : (
                    t.appointments.onlineSession
                  )
                }
              />
            ) : appointment.room ? (
              <DetailRow
                icon={<IconRoom />}
                label={t.appointments.room}
                value={getBilingualName(
                  appointment.room.name,
                  appointment.room.nameAr,
                  lang,
                )}
              />
            ) : null}
            <DetailRow
              icon={<IconTime />}
              label={t.appointments.appointmentDetails}
              value={`${appointment.durationMins} ${t.appointments.minutesShort} · ${formatClinicAmount(pricing.payable)}`}
            />
            {waitingMins != null ? (
              <DetailRow
                icon={<IconTime />}
                label={t.queue.estimatedWait}
                value={formatWaitingMins(waitingMins, false, t)}
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-3 py-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t.common.close}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onExpand({ ...appointment, status })}
          >
            <IconMaximize />
            {t.appointments.openAppointment}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  const title = typeof value === 'string' ? value : undefined;

  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground shadow-2xs [&_svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <SoftTip label={title}>
          <p className="break-words font-medium text-foreground">{value}</p>
        </SoftTip>
      </div>
    </div>
  );
}
