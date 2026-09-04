'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg, type EventResizeDoneArg } from '@fullcalendar/interaction';
import {
  DatesSetArg,
  EventClickArg,
  DateSelectArg,
  EventDropArg,
  EventMountArg,
  MoreLinkContentArg,
} from '@fullcalendar/core';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Appointment } from '@/services/appointments.service';
import { STATUS_COLORS } from '../shared/status-badge';
import { patientDisplayName } from '../shared/appointment-display';
import { CalendarEventChip, readCalendarAppointment } from './calendar-event-chip';
import {
  AppointmentPopover,
  popoverAnchorFromElement,
  type AppointmentPopoverState,
} from './appointment-popovers';
import { FC_TO_VIEW, ScheduleView, VIEW_TO_FC } from './schedule-nav';
import { CalendarSkeleton } from './calendar-skeleton';
import { ViewFocusToggle } from './view-focus';
import { useUpdateAppointment } from '@/hooks/api/use-appointments';
import { useResizeObserver } from '@/hooks/shared/use-resize-observer';
import { useIsMobile } from '@/hooks/shared/use-media-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { formatTime } from '@/lib/datetime';
import { useLanguage } from '@/providers';
import arLocale from '@fullcalendar/core/locales/ar';

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
        other.status === 'cancelled' ||
        other.status === 'no_show'
      ) {
        return false;
      }
      const otherStart = new Date(other.scheduledAt).getTime();
      const overlaps = startTime < otherStart + other.durationMins * 60000 && endTime > otherStart;
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
  onViewChange: (view: ScheduleView) => void;
  onVisibleRangeChange?: (start: Date, end: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onSelectSlot: (date: Date) => void;
}

export function AppointmentCalendar({
  appointments,
  isLoading,
  isFetching,
  view,
  focused = false,
  onViewChange,
  onVisibleRangeChange,
  onEventClick,
  onSelectSlot,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const updateMutation = useUpdateAppointment();
  const isMobile = useIsMobile();
  const { t, lang } = useLanguage();
  const [appointmentPopover, setAppointmentPopover] =
    useState<AppointmentPopoverState | null>(null);

  const events = useMemo(
    () =>
      (appointments ?? []).map((appointment) => ({
        id: appointment.id,
        title: patientDisplayName(appointment, lang),
        start: appointment.scheduledAt,
        end: new Date(
          new Date(appointment.scheduledAt).getTime() + appointment.durationMins * 60000,
        ).toISOString(),
        backgroundColor: STATUS_COLORS[appointment.status],
        borderColor: STATUS_COLORS[appointment.status],
        textColor: 'var(--color-primary-foreground)',
        display: 'block' as const,
        editable:
          appointment.status !== 'cancelled' && appointment.status !== 'completed',
        classNames: appointment.status === 'cancelled' ? ['fc-event-cancelled'] : [],
        extendedProps: { appointment },
      })),
    [appointments, lang],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const appt = readCalendarAppointment(arg.event.extendedProps);
    if (!appt) return;
    setAppointmentPopover({
      appointment: appt,
      anchor: popoverAnchorFromElement(arg.el),
    });
  }, []);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      if (arg.view.type !== 'dayGridMonth') return;
      const target = arg.jsEvent.target;
      if (target instanceof Element && target.closest('.fc-event, .fc-more-link')) return;
      setAppointmentPopover(null);
      const slot = new Date(arg.date);
      if (slot.getHours() === 0 && slot.getMinutes() === 0) {
        slot.setHours(9, 0, 0, 0);
      }
      onSelectSlot(slot);
    },
    [onSelectSlot],
  );

  const handleDateSelect = useCallback(
    (arg: DateSelectArg) => {
      setAppointmentPopover(null);
      onSelectSlot(arg.start);
    },
    [onSelectSlot],
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
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
      if (appt.status === 'cancelled') {
        toast.error(t.appointments.cancelledCannotReschedule);
        info.revert();
        return;
      }

      const scheduledAt = info.event.start.toISOString();
      const durationMins = info.event.end
        ? Math.max(
            15,
            Math.round((info.event.end.getTime() - info.event.start.getTime()) / 60000),
          )
        : appt.durationMins;

      if (
        hasScheduleConflict(appointments, appt, info.event.start.getTime(), durationMins)
      ) {
        toast.warning(t.appointments.scheduleConflictWarning);
      }

      updateMutation.mutate(
        { id: appt.id, data: { scheduledAt, durationMins } },
        {
          onError: (err) => {
            info.revert();
            toast.error(extractErrorMessage(err) || t.appointments.rescheduleFailed);
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
      if (appt.status === 'cancelled') {
        info.revert();
        return;
      }

      const durationMins = Math.max(
        15,
        Math.round((info.event.end.getTime() - info.event.start.getTime()) / 60000),
      );

      updateMutation.mutate(
        { id: appt.id, data: { durationMins } },
        {
          onError: (err) => {
            info.revert();
            toast.error(extractErrorMessage(err) || t.appointments.durationUpdateFailed);
          },
        },
      );
    },
    [t, updateMutation],
  );

  const renderMoreLinkContent = useCallback(
    (arg: MoreLinkContentArg) => (
      <Badge variant="info" className="fc-more-badge pointer-events-none flex w-full justify-center text-[10px] font-semibold">
        +{arg.num} {t.appointments.more}
      </Badge>
    ),
    [t],
  );

  const handleEventDidMount = useCallback((info: EventMountArg) => {
    const appt = readCalendarAppointment(info.event.extendedProps);
    const color = appt
      ? STATUS_COLORS[appt.status]
      : info.event.backgroundColor || 'var(--color-muted-foreground)';
    info.el.style.setProperty('background-color', color, 'important');
    info.el.style.setProperty('border-color', color, 'important');
  }, []);

  const handleDayCellDidMount = useCallback(
    (arg: { view: { type: string }; el: HTMLElement; date: Date }) => {
      if (arg.view.type !== 'dayGridMonth') return;
      const frame = arg.el.querySelector('.fc-daygrid-day-frame');
      if (!frame || frame.querySelector('.fc-day-add')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fc-day-add';
    btn.setAttribute('aria-label', t.appointments.addAppointment);
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
      btn.setAttribute('aria-hidden', 'true');
      btn.tabIndex = -1;
      frame.appendChild(btn);
    },
    [t],
  );

  const syncCalendarSize = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    try {
      api.updateSize();
    } catch {
      return;
    }
  }, []);

  const sizeHostRef = useResizeObserver(syncCalendarSize);

  if (isLoading && !appointments) {
    return <CalendarSkeleton />;
  }

  return (
    <div
      className={cn(
        'relative bg-card [&_.fc]:text-sm',
        focused
          ? 'flex h-0 min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 p-1.5 sm:p-2'
          : 'card-aura rounded-xl border p-2 sm:p-2.5',
      )}
      aria-busy={isFetching || undefined}
    >
      <div
        ref={sizeHostRef}
        className={cn(
          'relative [&_.fc-header-toolbar]:pe-9 sm:[&_.fc-header-toolbar]:pe-10',
          focused &&
            'flex h-0 min-h-0 flex-1 flex-col [&_.fc]:h-full [&_.fc-scroller]:min-h-0 [&_.fc-view-harness]:min-h-0',
        )}
      >
        <div className="absolute top-0 inset-e-0 z-20">
          <ViewFocusToggle />
        </div>
        <FullCalendar
          key={`${view}-${lang}`}
          ref={calendarRef}
          plugins={PLUGINS}
          initialView={VIEW_TO_FC[view]}
          locales={[arLocale]}
          locale={lang === 'ar' ? 'ar' : 'en'}
          direction={lang === 'ar' ? 'rtl' : 'ltr'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          buttonText={{
            today: t.appointments.today,
            day: t.appointments.day,
            week: t.appointments.week,
            month: t.appointments.month,
          }}
          height={focused ? '100%' : 'auto'}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          selectable
          selectMirror
          selectAllow={() => view !== 'month'}
          editable
          eventDurationEditable
          eventResizableFromStart
          nowIndicator
          slotLabelContent={(arg) => formatTime(arg.date, undefined, lang)}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: true,
            meridiem: 'short',
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
          moreLinkClassNames={['block', 'w-full']}
          expandRows
          stickyHeaderDates
          views={{
            timeGridDay: {
              slotMinTime: '07:00:00',
              slotMaxTime: '21:00:00',
              eventMaxStack: isMobile ? 2 : 4,
            },
            timeGridWeek: {
              eventMaxStack: isMobile ? 2 : 4,
            },
            dayGridMonth: {
              dayMaxEvents: isMobile ? 2 : 4,
              eventDisplay: 'block',
            },
          }}
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: '08:00',
            endTime: '20:00',
          }}
        />
      </div>

      {appointmentPopover ? (
        <AppointmentPopover
          key={appointmentPopover.appointment.id}
          state={appointmentPopover}
          onClose={() => setAppointmentPopover(null)}
          onExpand={(appt) => {
            setAppointmentPopover(null);
            onEventClick(appt);
          }}
        />
      ) : null}
    </div>
  );
}
