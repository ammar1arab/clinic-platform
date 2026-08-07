'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  DatesSetArg,
  EventClickArg,
  DateSelectArg,
  EventContentArg,
  MoreLinkContentArg,
} from '@fullcalendar/core';
import { MapPin, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Appointment } from '@/services/appointments.service';
import { STATUS_COLORS } from './status-colors';
import { EventPreview, EventPreviewState } from './event-preview';
import {
  formatApptStartAmPm,
  formatApptTimeRange,
  patientDisplayName,
} from './calendar-time';
import {
  FC_TO_VIEW,
  ScheduleView,
  VIEW_TO_FC,
} from './schedule-nav';
import { rectFromElement, type AnchorRect } from './popover-position';
import { CalendarSkeleton } from './calendar-skeleton';
import { ViewFocusToggle } from './view-focus';
import { useUpdateAppointment } from '@/hooks/use-appointments';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';

const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin];

interface CalendarEventProps {
  appointment: Appointment;
}

interface CalendarDropInfo {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
    extendedProps: CalendarEventProps;
  };
  revert: () => void;
}

interface CalendarResizeInfo {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
    extendedProps: CalendarEventProps;
  };
  revert: () => void;
}

function isAppointment(value: object): value is Appointment {
  return (
    'id' in value &&
    'scheduledAt' in value &&
    'status' in value &&
    'patient' in value &&
    'doctor' in value
  );
}

function readAppointment(extendedProps: object): Appointment | null {
  if (!('appointment' in extendedProps)) return null;
  const value = extendedProps.appointment;
  if (typeof value !== 'object' || value === null) return null;
  return isAppointment(value) ? value : null;
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

  const [preview, setPreview] = useState<EventPreviewState | null>(null);

  const openPreview = useCallback(
    (
      appt: Appointment,
      x: number,
      y: number,
      anchor?: AnchorRect,
    ) => {
      setPreview({ appointment: appt, x, y, anchor });
    },
    [],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const appt = readAppointment(arg.event.extendedProps);
      if (!appt) return;
      const target = arg.jsEvent.target;
      const fromEvent = target instanceof Element ? target.closest('.fc-event') : null;
      const el = arg.el ?? fromEvent;
      openPreview(
        appt,
        arg.jsEvent.clientX,
        arg.jsEvent.clientY,
        rectFromElement(el, arg.jsEvent.clientX, arg.jsEvent.clientY),
      );
    },
    [openPreview],
  );

  const handleDateSelect = useCallback(
    (arg: DateSelectArg) => {
      setPreview(null);
      onSelectSlot(arg.start);
    },
    [onSelectSlot],
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const next = FC_TO_VIEW[arg.view.type];
      if (next && next !== view) {
        onViewChange(next);
      }
      onVisibleRangeChange?.(arg.start, arg.end);
    },
    [view, onViewChange, onVisibleRangeChange],
  );

  const handleEventDrop = useCallback(
    (info: CalendarDropInfo) => {
      const appt = info.event.extendedProps.appointment;
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
        ? Math.max(15, Math.round((info.event.end.getTime() - info.event.start.getTime()) / 60000))
        : appt.durationMins;

      const startTime = info.event.start.getTime();
      const endTime = startTime + durationMins * 60000;
      const hasConflict = appointments?.some((other) => {
        if (other.id === appt.id) return false;
        if (other.status === 'cancelled' || other.status === 'no_show') return false;
        const otherStart = new Date(other.scheduledAt).getTime();
        const otherEnd = otherStart + other.durationMins * 60000;
        const overlaps = startTime < otherEnd && endTime > otherStart;
        if (!overlaps) return false;
        return (
          other.doctorId === appt.doctorId ||
          (appt.roomId && other.roomId && other.roomId === appt.roomId)
        );
      });

      if (hasConflict) {
        toast.warning('Conflict detected: Doctor or room has overlapping appointment');
      }

      updateMutation.mutate(
        {
          id: appt.id,
          data: {
            scheduledAt,
            durationMins,
          },
        },
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
    (info: CalendarResizeInfo) => {
      const appt = info.event.extendedProps.appointment;
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
        {
          id: appt.id,
          data: { durationMins },
        },
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
      <span className="fc-more-badge inline-flex h-5 items-center justify-center rounded-full border border-primary/25 bg-primary/10 px-2 text-[10px] font-semibold leading-none text-primary shadow-2xs transition-colors dark:bg-primary/15">
        +{arg.num} more
      </span>
    ),
    [],
  );

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const appt = readAppointment(arg.event.extendedProps);
    const viewType = arg.view.type;
    const isMonth = viewType === 'dayGridMonth';
    const isDay = viewType === 'timeGridDay';
    const isWeek = viewType === 'timeGridWeek';

    if (isMonth) {
      const fill = appt
        ? STATUS_COLORS[appt.status]
        : arg.event.backgroundColor || '#64748b';
      return (
        <div
          className="fc-event-inner fc-event-month flex min-h-[1.35rem] min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-white"
          style={{ backgroundColor: fill, color: '#fff' }}
        >
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-white">
            {appt ? formatApptStartAmPm(appt) : arg.timeText}
          </span>
          <span className="min-w-0 truncate text-[10px] font-medium leading-tight text-white">
            {arg.event.title}
          </span>
        </div>
      );
    }

    const Icon = appt?.sessionType === 'online' ? Video : MapPin;
    const timeLabel = appt ? formatApptTimeRange(appt) : arg.timeText;

    if (isDay) {
      return (
        <div className="fc-event-inner flex h-full min-h-0 flex-col gap-1 overflow-hidden px-2 py-1.5 text-left">
          <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
          <span className="text-[11px] font-semibold leading-tight tracking-wide opacity-95">
            {timeLabel}
          </span>
          <span className="truncate text-sm font-semibold leading-tight">
            {arg.event.title}
          </span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'fc-event-inner flex h-full min-h-0 flex-col overflow-hidden px-1.5 py-1 text-left leading-tight',
          isWeek ? 'gap-0.5' : 'gap-0',
        )}
      >
        <Icon className="size-3 shrink-0 opacity-90" aria-hidden />
        <span className="truncate text-[10px] font-semibold opacity-95">{timeLabel}</span>
        <span className="truncate text-[11px] font-semibold">{arg.event.title}</span>
      </div>
    );
  }, []);

  const handleEventDidMount = useCallback(
    (info: {
      event: { extendedProps: object; backgroundColor?: string };
      el: HTMLElement;
    }) => {
      const appt = readAppointment(info.event.extendedProps);
      const color = appt
        ? STATUS_COLORS[appt.status]
        : info.event.backgroundColor || '#64748b';
      info.el.style.setProperty('background-color', color, 'important');
      info.el.style.setProperty('border-color', color, 'important');
      info.el.style.setProperty('color', '#ffffff', 'important');
    },
    [],
  );

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
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPreview(null);
        const slot = new Date(arg.date);
        if (slot.getHours() === 0 && slot.getMinutes() === 0) {
          slot.setHours(9, 0, 0, 0);
        }
        onSelectSlot(slot);
      });
      frame.appendChild(btn);
    },
    [onSelectSlot],
  );

  const syncCalendarSize = useCallback(() => {
    calendarRef.current?.getApi().updateSize();
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
          ? 'flex h-full min-h-0 flex-col overflow-hidden rounded-none border-0 p-2 sm:p-3'
          : 'card-aura rounded-xl border p-2 sm:p-3 lg:p-4',
      )}
      aria-busy={isFetching || undefined}
    >
      <div
        ref={sizeHostRef}
        className={cn(
          'relative [&_.fc-header-toolbar]:pr-10',
          focused && 'flex h-full min-h-0 flex-1 flex-col [&_.fc]:h-full [&_.fc-view-harness]:min-h-0',
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
          events={events}
          eventDisplay="block"
          eventDidMount={handleEventDidMount}
          dayCellDidMount={handleDayCellDidMount}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop as never}
          eventResize={handleEventResize as never}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          eventContent={renderEventContent}
          dayMaxEvents={4}
          eventMaxStack={4}
          moreLinkClick="popover"
          moreLinkContent={renderMoreLinkContent}
          expandRows
          stickyHeaderDates
          views={{
            timeGridDay: {
              slotMinTime: '07:00:00',
              slotMaxTime: '21:00:00',
              eventMaxStack: 4,
            },
            timeGridWeek: {
              eventMaxStack: 4,
            },
            dayGridMonth: {
              dayMaxEvents: 4,
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

      {preview && (
        <EventPreview
          preview={preview}
          preferVertical={view === 'day'}
          onClose={() => setPreview(null)}
          onExpand={(appt) => {
            setPreview(null);
            onEventClick(appt);
          }}
        />
      )}
    </div>
  );
}
