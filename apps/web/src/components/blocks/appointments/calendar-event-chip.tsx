'use client';

import type { EventContentArg } from '@fullcalendar/core';
import type { Appointment } from '@/services/appointments.service';
import {
  doctorDisplayName,
  formatApptStartAmPm,
  formatApptTimeRange,
  formatApptTip,
  formatDoctorLabel,
  patientDisplayName,
} from './appointment-display';
import { formatTime, formatTimeRange } from '@/lib/datetime';
import { IconInPerson, IconOnline } from '@/constants/icons';
import { SoftTip } from '@/components/primitives';
import { useLanguage } from '@/providers';

function isAppointment(value: object): value is Appointment {
  return (
    'id' in value &&
    'scheduledAt' in value &&
    'status' in value &&
    'patient' in value &&
    'doctor' in value
  );
}

export function readCalendarAppointment(extendedProps: object): Appointment | null {
  if (!('appointment' in extendedProps)) return null;
  const value = extendedProps.appointment;
  if (typeof value !== 'object' || value === null) return null;
  return isAppointment(value) ? value : null;
}

export function CalendarEventChip({ arg }: { arg: EventContentArg }) {
  const { lang } = useLanguage();
  const appt = readCalendarAppointment(arg.event.extendedProps);
  const isMonth = arg.view.type === 'dayGridMonth';
  const fullName = appt ? patientDisplayName(appt, lang) : arg.event.title;
  const start = arg.event.start;
  const end = arg.event.end;
  const startLabel = appt
    ? formatApptStartAmPm(appt, lang)
    : start
      ? formatTime(start, undefined, lang)
      : arg.timeText;
  const rangeLabel = appt
    ? formatApptTimeRange(appt, lang)
    : start && end
      ? formatTimeRange(start, end, undefined, lang)
      : arg.timeText;
  const doctorName = appt?.doctor ? doctorDisplayName(appt.doctor, lang) : undefined;
  const tip = appt ? formatApptTip(appt, { rangeLabel, doctorName, lang }) : fullName;
  const Icon = appt?.sessionType === 'online' ? IconOnline : IconInPerson;

  if (isMonth) {
    return (
      <SoftTip label={tip}>
        <div className="fc-event-chip fc-event-chip--month">
          <span className="fc-event-chip__time">{startLabel}</span>
          <span className="fc-event-chip__name">{fullName}</span>
        </div>
      </SoftTip>
    );
  }

  return (
    <SoftTip label={tip}>
      <div className="fc-event-chip fc-event-chip--time">
        <div className="fc-event-chip__primary">
          <Icon className="fc-event-chip__icon" aria-hidden />
          <span className="fc-event-chip__time fc-event-chip__time--compact">
            {startLabel}
          </span>
          <span className="fc-event-chip__name">{fullName}</span>
        </div>
        <div className="fc-event-chip__secondary">
          <span className="fc-event-chip__range">{rangeLabel}</span>
          {doctorName ? (
            <span className="fc-event-chip__doctor">
              {formatDoctorLabel(appt?.doctor ?? doctorName, { short: true, lang })}
            </span>
          ) : null}
          {appt?.service?.name ? (
            <span className="fc-event-chip__service">
              {lang === 'ar' && appt.service.nameAr ? appt.service.nameAr : appt.service.name}
            </span>
          ) : null}
        </div>
      </div>
    </SoftTip>
  );
}
