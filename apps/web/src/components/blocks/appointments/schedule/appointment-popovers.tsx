'use client';

import { useState, type ReactNode } from 'react';
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
import { keepNestedPortals } from '@/lib/overlay';
import { formatClinicAmount } from '@/lib/package-balance';
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
import { STATUS_COLORS } from '../shared/status-badge';

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

export function popoverAnchorFromElement(element: Element): PopoverAnchorRect {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function FixedAnchor({ anchor }: { anchor: PopoverAnchorRect }) {
  return (
    <PopoverAnchor asChild>
      <span
        aria-hidden
        className="pointer-events-none fixed z-90"
        style={{
          left: anchor.left,
          top: anchor.top,
          width: anchor.width,
          height: anchor.height,
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

function preferredSide(anchor: PopoverAnchorRect): 'top' | 'bottom' | 'left' | 'right' {
  if (typeof window === 'undefined') return 'bottom';
  const centerX = anchor.left + anchor.width / 2;
  const centerY = anchor.top + anchor.height / 2;
  if (window.innerWidth < 768) return centerY > window.innerHeight * 0.55 ? 'top' : 'bottom';
  return centerX > window.innerWidth / 2 ? 'left' : 'right';
}

export function AppointmentPopover({
  state,
  onClose,
  onExpand,
}: {
  state: AppointmentPopoverState;
  onClose: () => void;
  onExpand: (appointment: Appointment) => void;
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

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <FixedAnchor anchor={state.anchor} />
      <PopoverContent
        data-calendar-popover="appointment"
        aria-label={title}
        side={preferredSide(state.anchor)}
        align="center"
        sideOffset={10}
        onInteractOutside={keepNestedPortals}
        className="w-[min(calc(100vw-1rem),23rem)] overflow-hidden p-0"
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
                value={(lang === 'ar' && appointment.service.nameAr) || appointment.service.name}
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
                value={(lang === 'ar' && appointment.room.nameAr) || appointment.room.name}
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
