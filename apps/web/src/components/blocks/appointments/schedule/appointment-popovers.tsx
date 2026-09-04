"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui";
import { SoftTip } from "@/components/primitives";
import {
  IconClose,
  IconMaximize,
  IconOnline,
  IconPerson,
  IconRoom,
  IconService,
  IconTime,
} from "@/constants/icons";
import { useMediaQuery } from "@/hooks/shared/use-media-query";
import { useNow } from "@/hooks/shared/use-now";
import { getBilingualName } from "@/i18n";
import { keepNestedPortals, OVERLAY_COLLISION_PADDING } from "@/lib/overlay";
import { formatClinicAmount } from "@/lib/package-balance";
import { cn } from "@/lib/utils";
import { formatWaitingMins, resolveWaitingMins } from "@/lib/waiting-time";
import { useLanguage } from "@/providers";
import {
  type Appointment,
  type AppointmentStatus,
  computePayable,
} from "@/services/appointments.service";
import {
  formatApptTimeRange,
  formatDoctorLabel,
  patientDisplayName,
} from "../shared/appointment-display";
import { AppointmentStatusSelect } from "../shared/appointment-status-select";
import { STATUS_COLORS, StatusBadgeBlock } from "../shared/status-badge";

export type PopoverAnchorRect = Element;

export type AppointmentPopoverState = {
  appointment: Appointment;
  anchor: Element;
};

export type DayAppointmentsPopoverState = {
  date: Date;
  appointments: Appointment[];
  anchor: Element;
};

export type CalendarPopoverPlacement = "month" | "vertical";

export const SCHEDULE_HOST = "data-schedule-host";

export function popoverAnchorFromElement(element: Element): Element {
  return (
    element.closest(
      ".fc-more-link, .fc-timegrid-more-link, .fc-event, [data-appt], [data-queue-card]",
    ) ?? element
  );
}

const POPOVER_SURFACE =
  "z-110 flex w-[min(calc(100vw-1rem),20rem)] max-h-[min(var(--radix-popover-content-available-height),70dvh)] flex-col overflow-hidden overflow-y-hidden p-0 text-xs touch-manipulation sm:w-[min(calc(100vw-1.5rem),22rem)]";

function scheduleHostOf(element: Element): HTMLElement | null {
  return element.closest<HTMLElement>(`[${SCHEDULE_HOST}]`);
}

function LiveAnchor({ element }: { element: Element }) {
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          element.isConnected ? element.getBoundingClientRect() : new DOMRect(),
      },
    }),
    [element],
  );
  return <PopoverAnchor virtualRef={virtualRef} />;
}

function monthSide(element: Element): "left" | "right" {
  const box = element.getBoundingClientRect();
  return box.left + box.width / 2 > window.innerWidth / 2 ? "left" : "right";
}

function SchedulePopover({
  element,
  placement,
  label,
  onClose,
  children,
  kind,
}: {
  element: Element;
  placement: CalendarPopoverPlacement;
  label?: string;
  onClose: () => void;
  children: ReactNode;
  kind: "more" | "appointment";
}) {
  const isWide = useMediaQuery("(min-width: 768px)");
  if (!element.isConnected) return null;
  const host = scheduleHostOf(element);
  const side = isWide && placement === "month" ? monthSide(element) : "bottom";
  const compact = !isWide;

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <LiveAnchor element={element} />
      <PopoverContent
        data-calendar-popover={kind}
        aria-label={label}
        collisionBoundary={compact ? undefined : host}
        hideWhenDetached
        align={compact ? "start" : "center"}
        side={side}
        sideOffset={compact ? 6 : 8}
        collisionPadding={compact ? OVERLAY_COLLISION_PADDING : 12}
        sticky="partial"
        onInteractOutside={keepNestedPortals}
        className={cn(POPOVER_SURFACE, kind === "appointment" && "z-120")}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function formatDay(value: Date | string, lang: string) {
  return new Date(value).toLocaleDateString(lang, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DayAppointmentsPopover({
  state,
  onClose,
  onSelect,
  placement = "vertical",
}: {
  state: DayAppointmentsPopoverState;
  onClose: () => void;
  onSelect: (appointment: Appointment, anchor: Element) => void;
  placement?: CalendarPopoverPlacement;
}) {
  const { t, lang } = useLanguage();

  const sorted = useMemo(
    () =>
      [...state.appointments].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [state.appointments],
  );

  return (
    <SchedulePopover
      element={state.anchor}
      placement={placement}
      label={formatDay(state.date, lang)}
      onClose={onClose}
      kind="more"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b px-2.5 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-semibold text-foreground">
            {formatDay(state.date, lang)}
          </h2>
          <p className="text-[10px] text-muted-foreground">
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
        {sorted.length ? (
          sorted.map((appointment) => {
            const doctor = formatDoctorLabel(appointment.doctor, { lang });
            const service = appointment.service
              ? getBilingualName(
                  appointment.service.name,
                  appointment.service.nameAr,
                  lang,
                )
              : null;
            const room =
              appointment.sessionType === "online"
                ? t.appointments.online
                : appointment.room
                  ? getBilingualName(
                      appointment.room.name,
                      appointment.room.nameAr,
                      lang,
                    )
                  : null;

            return (
              <button
                key={appointment.id}
                type="button"
                onClick={(event) => onSelect(appointment, event.currentTarget)}
                className={cn(
                  "flex w-full gap-2 rounded-md px-2 py-1.5 text-start outline-none",
                  "hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                      {patientDisplayName(appointment, lang)}
                    </span>
                    <StatusBadgeBlock
                      status={appointment.status}
                      compact
                      tip={false}
                    />
                  </div>
                  <p className="text-[10px] font-medium tabular-nums text-muted-foreground">
                    {formatApptTimeRange(appointment, lang)}
                    <span className="mx-1 text-border">·</span>
                    {appointment.durationMins} {t.appointments.minutesShort}
                  </p>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1 truncate">
                      <IconPerson className="size-2.5 shrink-0 text-primary" />
                      <span className="truncate">{doctor}</span>
                    </span>
                    {room ? (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1 truncate">
                        {appointment.sessionType === "online" ? (
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
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {t.appointments.noAppointmentsFound}
          </p>
        )}
      </div>
    </SchedulePopover>
  );
}

export function AppointmentPopover({
  state,
  onClose,
  onExpand,
  placement = "vertical",
}: {
  state: AppointmentPopoverState;
  onClose: () => void;
  onExpand: (appointment: Appointment) => void;
  placement?: CalendarPopoverPlacement;
}) {
  const { t, lang } = useLanguage();
  const compact = !useMediaQuery("(min-width: 768px)");
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
    <SchedulePopover
      element={state.anchor}
      placement={placement}
      label={title}
      onClose={onClose}
      kind="appointment"
    >
      <div className="h-1 shrink-0" style={{ backgroundColor: accent }} aria-hidden />
      <div className="shrink-0 border-b px-2.5 py-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <SoftTip label={title}>
              <h2 className="truncate text-xs font-semibold text-foreground">
                {title}
              </h2>
            </SoftTip>
            <p className="text-[10px] text-muted-foreground">
              {formatDay(appointment.scheduledAt, lang)} ·{" "}
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
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            {t.appointments.status}
          </span>
          <AppointmentStatusSelect
            appointment={{ ...appointment, status }}
            onStatusChange={setStatus}
            compact={compact}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
        <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
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
          {appointment.sessionType === "online" ? (
            <DetailRow
              icon={<IconOnline />}
              label={t.appointments.sessionType}
              value={
                appointment.meetingUrl ? (
                  <a
                    href={appointment.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="wrap-break-word text-primary underline-offset-2 hover:underline"
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

      <div className="flex shrink-0 items-center justify-end gap-1.5 border-t bg-muted/20 px-2.5 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={onClose}
        >
          {t.common.close}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onExpand({ ...appointment, status })}
        >
          <IconMaximize />
          {t.appointments.openAppointment}
        </Button>
      </div>
    </SchedulePopover>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  const title = typeof value === "string" ? value : undefined;

  return (
    <div className="flex items-center gap-2">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-background text-muted-foreground shadow-2xs [&_svg]:size-3">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <SoftTip label={title}>
          <p className="wrap-break-word text-xs font-medium text-foreground">{value}</p>
        </SoftTip>
      </div>
    </div>
  );
}
