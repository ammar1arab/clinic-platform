"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import {
  DatesSetArg,
  EventClickArg,
  DateSelectArg,
  EventDropArg,
  EventMountArg,
  MoreLinkContentArg,
} from "@fullcalendar/core";
import { Badge, Button, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { SoftTip } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@/constants/icons";
import { Appointment } from "@/services/appointments.service";
import { STATUS_COLORS } from "../shared/status-badge";
import { patientDisplayName } from "../shared/appointment-display";
import {
  CalendarEventChip,
  readCalendarAppointment,
} from "./calendar-event-chip";
import {
  AppointmentPopover,
  DayAppointmentsPopover,
  popoverAnchorFromElement,
  type AppointmentPopoverState,
  type DayAppointmentsPopoverState,
} from "./appointment-popovers";
import { FC_TO_VIEW, ScheduleView, VIEW_TO_FC } from "./schedule-nav";
import { CalendarSkeleton } from "./calendar-skeleton";
import { useUpdateAppointment } from "@/hooks/api/use-appointments";
import { useResizeObserver } from "@/hooks/shared/use-resize-observer";
import { useIsMobile } from "@/hooks/shared/use-media-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api";
import { formatTime, toDateParam } from "@/lib/datetime";
import { useLanguage } from "@/providers";
import arLocale from "@fullcalendar/core/locales/ar";

const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin];

function hasScheduleConflict(
  appointments: Appointment[] | undefined,
  appointment: Appointment,
  startTime: number,
  durationMins: number,
) {
  const endTime = startTime + durationMins * 60000;
  return Boolean(
    appointments?.some((other) => {
      if (
        other.id === appointment.id ||
        other.status === "cancelled" ||
        other.status === "no_show"
      ) {
        return false;
      }
      const otherStart = new Date(other.scheduledAt).getTime();
      const overlaps =
        startTime < otherStart + other.durationMins * 60000 &&
        endTime > otherStart;
      return (
        overlaps &&
        (other.doctorId === appointment.doctorId ||
          Boolean(
            appointment.roomId &&
            other.roomId &&
            other.roomId === appointment.roomId,
          ))
      );
    }),
  );
}

interface Props {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  view: ScheduleView;
  focused?: boolean;
  canManageAppointments?: boolean;
  onViewChange: (view: ScheduleView) => void;
  onVisibleRangeChange?: (start: Date, end: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onSelectSlot: (date: Date) => void;
  hours?: { start: string; end: string };
}

export function AppointmentCalendar({
  appointments,
  isLoading,
  isFetching,
  view,
  focused = false,
  canManageAppointments = true,
  onViewChange,
  onVisibleRangeChange,
  onEventClick,
  onSelectSlot,
  hours,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const [visibleDate, setVisibleDate] = useState<Date>();
  const [calendarTitle, setCalendarTitle] = useState('');
  const updateMutation = useUpdateAppointment();
  const isMobile = useIsMobile();
  const { t, lang } = useLanguage();
  const [appointmentPopover, setAppointmentPopover] =
    useState<AppointmentPopoverState | null>(null);
  const [dayPopover, setDayPopover] =
    useState<DayAppointmentsPopoverState | null>(null);
  const scrollPositionsRef = useRef<
    Array<{ element: HTMLElement; top: number; left: number }>
  >([]);

  const captureScrollPositions = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const positions: typeof scrollPositionsRef.current = [];
    for (let node: Element | null = target; node; node = node.parentElement) {
      if (
        node instanceof HTMLElement &&
        (node.scrollHeight > node.clientHeight ||
          node.scrollWidth > node.clientWidth)
      ) {
        positions.push({
          element: node,
          top: node.scrollTop,
          left: node.scrollLeft,
        });
      }
    }
    const pageScroller = document.querySelector<HTMLElement>(
      "[data-page-scroll]",
    );
    if (
      pageScroller &&
      !positions.some(({ element }) => element === pageScroller)
    ) {
      positions.push({
        element: pageScroller,
        top: pageScroller.scrollTop,
        left: pageScroller.scrollLeft,
      });
    }
    scrollPositionsRef.current = positions;
  }, []);

  const restoreScrollPositions = useCallback(() => {
    window.requestAnimationFrame(() => {
      for (const { element, top, left } of scrollPositionsRef.current) {
        if (!element.isConnected) continue;
        element.scrollTop = top;
        element.scrollLeft = left;
      }
      scrollPositionsRef.current = [];
    });
  }, []);

  const { events, appointmentsByDay } = useMemo(() => {
    const byDay = new Map<string, Appointment[]>();
    const calendarEvents = (appointments ?? []).map((appointment) => {
      const key = toDateParam(new Date(appointment.scheduledAt));
      const items = byDay.get(key);
      if (items) items.push(appointment);
      else byDay.set(key, [appointment]);

      return {
        id: appointment.id,
        title: patientDisplayName(appointment, lang),
        start: appointment.scheduledAt,
        end: new Date(
          new Date(appointment.scheduledAt).getTime() +
            appointment.durationMins * 60000,
        ).toISOString(),
        backgroundColor: STATUS_COLORS[appointment.status],
        borderColor: STATUS_COLORS[appointment.status],
        textColor: "var(--color-primary-foreground)",
        display: "block" as const,
        editable:
          canManageAppointments &&
          appointment.status !== "cancelled" &&
          appointment.status !== "completed",
        classNames:
          appointment.status === "cancelled" ? ["fc-event-cancelled"] : [],
        extendedProps: { appointment },
      };
    });
    byDay.forEach((items) =>
      items.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    );
    return { events: calendarEvents, appointmentsByDay: byDay };
  }, [appointments, canManageAppointments, lang]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const appt = readCalendarAppointment(arg.event.extendedProps);
    if (!appt) return;
    arg.jsEvent.preventDefault();
    arg.jsEvent.stopPropagation();
    if (!scrollPositionsRef.current.length) {
      captureScrollPositions(arg.el);
    }
    const anchor = popoverAnchorFromElement(arg.el);
    window.setTimeout(() => {
      setDayPopover(null);
      setAppointmentPopover({ appointment: appt, anchor });
      restoreScrollPositions();
    }, 0);
  }, [captureScrollPositions, restoreScrollPositions]);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      if (arg.view.type !== "dayGridMonth") return;
      const target = arg.jsEvent.target;
      if (
        target instanceof Element &&
        target.closest(".fc-event, .fc-more-link")
      )
        return;
      setDayPopover(null);
      setAppointmentPopover(null);
      if (!canManageAppointments) {
        calendarRef.current?.getApi().changeView(VIEW_TO_FC.day, arg.date);
        return;
      }
      const slot = new Date(arg.date);
      if (slot.getHours() === 0 && slot.getMinutes() === 0) {
        slot.setHours(9, 0, 0, 0);
      }
      if (canManageAppointments) onSelectSlot(slot);
    },
    [canManageAppointments, onSelectSlot],
  );

  const handleDateSelect = useCallback(
    (arg: DateSelectArg) => {
      if (!canManageAppointments) return;
      setDayPopover(null);
      setAppointmentPopover(null);
      if (canManageAppointments) onSelectSlot(arg.start);
    },
    [canManageAppointments, onSelectSlot],
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      setCalendarTitle(arg.view.title);
      const currentDate = calendarRef.current?.getApi().getDate();
      if (currentDate) setVisibleDate((previous) => previous?.getTime() === currentDate.getTime() ? previous : currentDate);
      const next = FC_TO_VIEW[arg.view.type];
      if (next && next !== view) onViewChange(next);
      onVisibleRangeChange?.(arg.start, arg.end);
    },
    [view, onViewChange, onVisibleRangeChange],
  );

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const appt = readCalendarAppointment(info.event.extendedProps);
      if (!appt || !info.event.start) {
        info.revert();
        return;
      }
      if (appt.status === "cancelled") {
        toast.error(t.appointments.cancelledCannotReschedule);
        info.revert();
        return;
      }

      const scheduledAt = info.event.start.toISOString();
      const durationMins = info.event.end
        ? Math.max(
            15,
            Math.round(
              (info.event.end.getTime() - info.event.start.getTime()) / 60000,
            ),
          )
        : appt.durationMins;

      if (
        hasScheduleConflict(
          appointments,
          appt,
          info.event.start.getTime(),
          durationMins,
        )
      ) {
        toast.error(t.appointments.scheduleConflictWarning);
        info.revert();
        return;
      }

      updateMutation.mutate(
        { id: appt.id, data: { scheduledAt, durationMins } },
        {
          onError: (err) => {
            info.revert();
            toast.error(
              extractErrorMessage(err) || t.appointments.rescheduleFailed,
            );
          },
        },
      );
    },
    [appointments, t, updateMutation],
  );

  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const appt = readCalendarAppointment(info.event.extendedProps);
      if (!appt || !info.event.start || !info.event.end) {
        info.revert();
        return;
      }
      if (appt.status === "cancelled") {
        info.revert();
        return;
      }

      const durationMins = Math.max(
        15,
        Math.round(
          (info.event.end.getTime() - info.event.start.getTime()) / 60000,
        ),
      );

      updateMutation.mutate(
        { id: appt.id, data: { durationMins } },
        {
          onError: (err) => {
            info.revert();
            toast.error(
              extractErrorMessage(err) || t.appointments.durationUpdateFailed,
            );
          },
        },
      );
    },
    [t, updateMutation],
  );

  const renderMoreLinkContent = useCallback(
    (arg: MoreLinkContentArg) => (
      <Badge
        variant="info"
        className="fc-more-badge pointer-events-none flex w-full justify-center text-2xs font-semibold"
      >
        +{arg.num}
      </Badge>
    ),
    [],
  );

  const openDayPopover = useCallback(
    (link: Element, date: Date) => {
      const rawDate = toDateParam(date);
      const anchor = popoverAnchorFromElement(link);
      window.setTimeout(() => {
        setAppointmentPopover(null);
        setDayPopover({
          date,
          appointments: appointmentsByDay.get(rawDate) ?? [],
          anchor,
        });
        restoreScrollPositions();
      }, 0);
    },
    [appointmentsByDay, restoreScrollPositions],
  );

  const openMoreLink = useCallback(
    (link: Element) => {
      if (!scrollPositionsRef.current.length) captureScrollPositions(link);
      const dayElement = link.closest<HTMLElement>("[data-date]");
      const rawDate = dayElement?.getAttribute("data-date");
      const date = rawDate ? new Date(`${rawDate}T00:00:00`) : new Date();
      openDayPopover(link, date);
    },
    [captureScrollPositions, openDayPopover],
  );

  const handleCalendarClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest(".fc-more-link");
      if (!link || !event.currentTarget.contains(link)) return;
      event.preventDefault();
      event.stopPropagation();
      openMoreLink(link);
    },
    [openMoreLink],
  );

  const handleMoreLinkKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest(".fc-more-link");
      if (!link || !event.currentTarget.contains(link)) return;
      event.preventDefault();
      event.stopPropagation();
      openMoreLink(link);
    },
    [openMoreLink],
  );

  const handleEventDidMount = useCallback((info: EventMountArg) => {
    const appt = readCalendarAppointment(info.event.extendedProps);
    const color = appt
      ? STATUS_COLORS[appt.status]
      : info.event.backgroundColor || "var(--color-muted-foreground)";
    info.el.style.setProperty("background-color", color, "important");
    info.el.style.setProperty("border-color", color, "important");
  }, []);

  const handleDayCellDidMount = useCallback(
    (arg: { view: { type: string }; el: HTMLElement; date: Date }) => {
      if (arg.view.type !== "dayGridMonth") return;
      const frame = arg.el.querySelector(".fc-daygrid-day-frame");
      if (!frame || frame.querySelector(".fc-day-add")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fc-day-add";
      btn.setAttribute("aria-label", t.appointments.addAppointment);
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
      btn.setAttribute("aria-hidden", "true");
      btn.tabIndex = -1;
      frame.appendChild(btn);
    },
    [t],
  );

  const calendarSizeRef = useRef({ width: 0, height: 0 });
  const syncCalendarSize = useCallback((host: HTMLElement) => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (
      calendarSizeRef.current.width === width &&
      calendarSizeRef.current.height === height
    ) {
      return;
    }
    const api = calendarRef.current?.getApi();
    if (!api) return;
    calendarSizeRef.current = { width, height };
    const positions = Array.from(host.querySelectorAll<HTMLElement>('.fc-scroller'), (element) => ({ element, top: element.scrollTop, left: element.scrollLeft }));
    try {
      api.updateSize();
    } catch {
      return;
    }
    for (const { element, top, left } of positions) {
      if (!element.isConnected) continue;
      element.scrollTop = top;
      element.scrollLeft = left;
    }
  }, []);

  const sizeHostRef = useResizeObserver(syncCalendarSize);

  if (isLoading && !appointments) {
    return <CalendarSkeleton view={view} focused={focused} />;
  }

  return (
    <div
      data-schedule-host=""
      className={cn(
        "relative page-fill flex-1 min-h-0 bg-card [&_.fc]:text-sm",
        "card-aura rounded-xl border",
        focused ? "p-1.5 sm:p-2" : "p-2 sm:p-2.5",
      )}
      aria-busy={isFetching || undefined}
    >
      <div className="mb-2 flex shrink-0 items-center gap-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
        <div className="flex min-w-0 items-center gap-1 sm:contents">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" aria-label={t.common.previous} onClick={() => calendarRef.current?.getApi().prev()}>
            <IconChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label={t.common.next} onClick={() => calendarRef.current?.getApi().next()}>
            <IconChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
        <Tabs value={view} onValueChange={(value) => {
          if (value === 'day' || value === 'week' || value === 'month') calendarRef.current?.getApi().changeView(VIEW_TO_FC[value]);
        }}>
          <TabsList variant="pill" aria-label={t.layout.titles.schedule}>
            <TabsTrigger value="day" className="px-1.5 sm:px-4">{t.appointments.day}</TabsTrigger>
            <TabsTrigger value="week" className="px-1.5 sm:px-4">{t.appointments.week}</TabsTrigger>
            <TabsTrigger value="month" className="px-1.5 sm:px-4">{t.appointments.month}</TabsTrigger>
          </TabsList>
        </Tabs>
        </div>
        <div className="ms-auto flex min-w-0 items-center justify-end gap-1 sm:ms-0 sm:gap-2">
          <h2 className="min-w-0 truncate text-xs font-semibold sm:text-sm" title={calendarTitle}>{calendarTitle}</h2>
          <SoftTip label={t.appointments.today}>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => calendarRef.current?.getApi().today()} aria-label={t.appointments.today}>
              <IconCalendar className="size-3.5" />
            </Button>
          </SoftTip>
        </div>
      </div>
      <div
        ref={sizeHostRef}
        onClickCapture={handleCalendarClickCapture}
        onKeyDownCapture={handleMoreLinkKeyDown}
        onPointerDownCapture={(event) => {
          if (!(event.target instanceof Element)) return;
          if (event.target.closest("[data-calendar-popover]")) return;
          if (event.target.closest(".fc-event, .fc-more-link")) {
            captureScrollPositions(event.target);
          } else {
            scrollPositionsRef.current = [];
          }
          if (event.target.closest(".fc-event, .fc-more-link")) return;
          setAppointmentPopover(null);
          setDayPopover(null);
        }}
        className="relative flex h-0 min-h-0 flex-1 flex-col [&_.fc]:h-full [&_.fc-scroller]:min-h-0 [&_.fc-view-harness]:min-h-0"
      >
        <FullCalendar
          key={`${view}-${lang}-${hours?.start ?? ''}-${hours?.end ?? ''}`}
          ref={calendarRef}
          plugins={PLUGINS}
          initialView={VIEW_TO_FC[view]}
          initialDate={visibleDate}
          locales={[arLocale]}
          locale={lang === "ar" ? "ar" : "en"}
          direction={lang === "ar" ? "rtl" : "ltr"}
          headerToolbar={false}
          buttonText={{
            today: t.appointments.today,
            day: t.appointments.day,
            week: t.appointments.week,
            month: t.appointments.month,
          }}
          height="100%"
          slotMinTime={hours ? `${hours.start}:00` : '07:00:00'}
          slotMaxTime={hours ? `${hours.end}:00` : '21:00:00'}
          allDaySlot={false}
          selectable={canManageAppointments}
          selectMirror
          longPressDelay={500}
          selectLongPressDelay={500}
          eventLongPressDelay={300}
          selectMinDistance={12}
          selectAllow={() => view !== "month"}
          editable={canManageAppointments}
          eventDurationEditable={canManageAppointments}
          eventResizableFromStart={canManageAppointments}
          nowIndicator
          slotLabelContent={(arg) => formatTime(arg.date, undefined, lang)}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            omitZeroMinute: true,
            meridiem: "short",
            hour12: true,
          }}
          events={events}
          eventDisplay="block"
          eventDidMount={handleEventDidMount}
          dayCellDidMount={handleDayCellDidMount}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          eventContent={(arg) => <CalendarEventChip arg={arg} />}
          dayMaxEvents={isMobile ? 2 : 4}
          eventMaxStack={isMobile ? 2 : 4}
          slotEventOverlap={false}
          eventMinHeight={isMobile ? 28 : 32}
          moreLinkContent={renderMoreLinkContent}
          moreLinkClassNames={["block", "w-full"]}
          expandRows
          stickyHeaderDates
          views={{
            timeGridDay: {
              slotMinTime: hours ? `${hours.start}:00` : '07:00:00',
              slotMaxTime: hours ? `${hours.end}:00` : '21:00:00',
              eventMaxStack: isMobile ? 2 : 4,
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: 'short' },
              eventMaxStack: isMobile ? 2 : 4,
            },
            dayGridMonth: {
              dayMaxEvents: isMobile ? 2 : 4,
              eventDisplay: "block",
            },
          }}
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: hours?.start ?? "08:00",
            endTime: hours?.end ?? "20:00",
          }}
        />
      </div>

      {dayPopover ? (
        <DayAppointmentsPopover
          state={dayPopover}
          placement={view === "month" ? "month" : "vertical"}
          onClose={() => {
            setDayPopover(null);
            setAppointmentPopover(null);
          }}
          onSelect={(appointment, anchor) => {
            setAppointmentPopover({ appointment, anchor });
          }}
        />
      ) : null}

      {appointmentPopover ? (
        <AppointmentPopover
          key={appointmentPopover.appointment.id}
          state={appointmentPopover}
          placement={view === "month" ? "month" : "vertical"}
          onClose={() => setAppointmentPopover(null)}
          onExpand={(appt) => {
            setAppointmentPopover(null);
            setDayPopover(null);
            onEventClick(appt);
          }}
        />
      ) : null}
    </div>
  );
}
