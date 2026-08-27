'use client';

import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react';
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
import { STATUS_COLORS } from './status-badge';
import { formatApptTip, patientDisplayName } from './appointment-display';
import { hasScheduleConflict } from './appointment-conflict';
import { CalendarEventChip, readCalendarAppointment } from './calendar-event-chip';
import { CalendarMoreList, type CalendarMoreState } from './calendar-more-list';
import { EventPreview, type EventPreviewState, type PreviewPlacement } from './event-preview';
import { rectFromElement } from './popover-position';
import { FC_TO_VIEW, ScheduleView, VIEW_TO_FC } from './schedule-nav';
import { CalendarSkeleton } from './calendar-skeleton';
import { ViewFocusToggle } from './view-focus';
import { useUpdateAppointment } from '@/hooks/api/use-appointments';
import { useResizeObserver } from '@/hooks/shared/use-resize-observer';
import { useIsMobile } from '@/hooks/shared/use-media-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { formatTime } from '@/lib/datetime';

const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin];

function dayAppointments(list: Appointment[] | undefined, date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return (list ?? [])
    .filter((appt) => {
      const t = new Date(appt.scheduledAt).getTime();
      return t >= start && t < end;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
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
  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;
  const updateMutation = useUpdateAppointment();
  const isMobile = useIsMobile();
  const [preview, setPreview] = useState<EventPreviewState | null>(null);
  const [overflow, setOverflow] = useState<CalendarMoreState | null>(null);

  const events = useMemo(
    () =>
      appointments?.map((appt) => ({
        id: appt.id,
        title: patientDisplayName(appt),
        start: appt.scheduledAt,
        end: new Date(
          new Date(appt.scheduledAt).getTime() + appt.durationMins * 60000,
        ).toISOString(),
        backgroundColor: STATUS_COLORS[appt.status],
        borderColor: STATUS_COLORS[appt.status],
        textColor: '#ffffff',
        display: 'block' as const,
        editable: appt.status !== 'cancelled' && appt.status !== 'completed',
        classNames: appt.status === 'cancelled' ? ['fc-event-cancelled'] : [],
        extendedProps: { appointment: appt },
      })) ?? [],
    [appointments],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const appt = readCalendarAppointment(arg.event.extendedProps);
    if (!appt) return;
    const target = arg.jsEvent.target;
    const fromEvent = target instanceof Element ? target.closest('.fc-event') : null;
    const el = arg.el ?? fromEvent;
    setPreview({
      appointment: appt,
      x: arg.jsEvent.clientX,
      y: arg.jsEvent.clientY,
      anchor: rectFromElement(el, arg.jsEvent.clientX, arg.jsEvent.clientY),
    });
  }, []);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      if (arg.view.type !== 'dayGridMonth') return;
      const target = arg.jsEvent.target;
      if (target instanceof Element && target.closest('.fc-event, .fc-more-link')) return;
      setPreview(null);
      setOverflow(null);
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
      setPreview(null);
      setOverflow(null);
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
        toast.error('Cancelled appointments cannot be rescheduled');
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
        toast.warning('Conflict detected: Doctor or room has overlapping appointment');
      }

      updateMutation.mutate(
        { id: appt.id, data: { scheduledAt, durationMins } },
        {
          onError: (err) => {
            info.revert();
            toast.error(extractErrorMessage(err) || 'Failed to reschedule appointment');
          },
        },
      );
    },
    [appointments, updateMutation],
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
            toast.error(extractErrorMessage(err) || 'Failed to update duration');
          },
        },
      );
    },
    [updateMutation],
  );

  const renderMoreLinkContent = useCallback(
    (arg: MoreLinkContentArg) => (
      <Badge variant="info" className="fc-more-badge pointer-events-none text-[10px] font-semibold">
        +{arg.num} more
      </Badge>
    ),
    [],
  );

  const openDayMore = useCallback((link: Element, clientX: number, clientY: number) => {
    const dayEl = link.closest<HTMLElement>('[data-date]');
    const raw = dayEl?.getAttribute('data-date');
    const date = raw ? new Date(`${raw}T00:00:00`) : new Date();
    setPreview(null);
    setOverflow({
      date,
      appointments: dayAppointments(appointmentsRef.current, date),
      x: clientX,
      y: clientY,
      anchor: rectFromElement(link, clientX, clientY),
    });
  }, []);

  const handleCalendarPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('.fc-more-link');
      if (!link || !event.currentTarget.contains(link)) return;
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      openDayMore(link, event.clientX, event.clientY);
    },
    [openDayMore],
  );

  const handleEventDidMount = useCallback((info: EventMountArg) => {
    const appt = readCalendarAppointment(info.event.extendedProps);
    const color = appt
      ? STATUS_COLORS[appt.status]
      : info.event.backgroundColor || 'var(--color-muted-foreground)';
    info.el.style.setProperty('background-color', color, 'important');
    info.el.style.setProperty('border-color', color, 'important');
    info.el.setAttribute('title', appt ? formatApptTip(appt) : info.event.title);
  }, []);

  const handleDayCellDidMount = useCallback(
    (arg: { view: { type: string }; el: HTMLElement; date: Date }) => {
      if (arg.view.type !== 'dayGridMonth') return;
      const frame = arg.el.querySelector('.fc-daygrid-day-frame');
      if (!frame || frame.querySelector('.fc-day-add')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fc-day-add';
      btn.setAttribute('aria-label', 'Add appointment');
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
      btn.setAttribute('aria-hidden', 'true');
      btn.tabIndex = -1;
      frame.appendChild(btn);
    },
    [],
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

  const previewPlacement: PreviewPlacement =
    isMobile || view === 'day' ? 'vertical' : 'horizontal';

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
        onPointerDownCapture={handleCalendarPointerDown}
        className={cn(
          'relative [&_.fc-header-toolbar]:pr-9 sm:[&_.fc-header-toolbar]:pr-10',
          focused &&
            'flex h-0 min-h-0 flex-1 flex-col [&_.fc]:h-full [&_.fc-scroller]:min-h-0 [&_.fc-view-harness]:min-h-0',
        )}
      >
        <div className="absolute top-0 right-0 z-20">
          <ViewFocusToggle />
        </div>
        <FullCalendar
          key={view}
          ref={calendarRef}
          plugins={PLUGINS}
          initialView={VIEW_TO_FC[view]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          buttonText={{
            today: 'Today',
            day: 'Day',
            week: 'Week',
            month: 'Month',
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
          slotLabelContent={(arg) => formatTime(arg.date)}
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

      {overflow ? (
        <CalendarMoreList
          state={overflow}
          onClose={() => setOverflow(null)}
          onSelect={(appt) => {
            setOverflow(null);
            setPreview({
              appointment: appt,
              x: overflow.x,
              y: overflow.y,
              anchor: overflow.anchor,
            });
          }}
        />
      ) : null}

      {preview ? (
        <EventPreview
          preview={preview}
          placement={previewPlacement}
          onClose={() => setPreview(null)}
          onExpand={(appt) => {
            setPreview(null);
            onEventClick(appt);
          }}
        />
      ) : null}
    </div>
  );
}
