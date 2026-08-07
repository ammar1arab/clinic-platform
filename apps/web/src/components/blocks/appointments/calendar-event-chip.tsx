'use client';

import { MapPin, Video } from 'lucide-react';
import type { EventContentArg } from '@fullcalendar/core';
import type { Appointment } from '@/services/appointments.service';
import { STATUS_COLORS } from './status-badge';
import {
  formatApptTimeRange,
  formatApptTip,
  formatCompactTime,
  formatDoctorLabel,
  patientDisplayName,
  patientShortName,
} from './appointment-display';

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
  const appt = readCalendarAppointment(arg.event.extendedProps);
  const isMonth = arg.view.type === 'dayGridMonth';
  const fullName = appt ? patientDisplayName(appt) : arg.event.title;
  const shortName = appt ? patientShortName(appt) : arg.event.title;
  const compactStart = appt ? formatCompactTime(appt.scheduledAt) : arg.timeText;
  const rangeLabel = appt ? formatApptTimeRange(appt) : arg.timeText;
  const doctorName = appt?.doctor?.name;
  const tip = appt ? formatApptTip(appt, { rangeLabel, doctorName }) : fullName;
  const Icon = appt?.sessionType === 'online' ? Video : MapPin;
  const fill = appt
    ? STATUS_COLORS[appt.status]
    : arg.event.backgroundColor || '#64748b';

  if (isMonth) {
    return (
      <div
        className="fc-event-chip fc-event-chip--month"
        title={tip}
        style={{ backgroundColor: fill, color: '#fff' }}
      >
        <span className="fc-event-chip__time">{compactStart}</span>
        <span className="fc-event-chip__name">{shortName}</span>
      </div>
    );
  }

  return (
    <div className="fc-event-chip fc-event-chip--time" title={tip}>
      <div className="fc-event-chip__primary">
        <Icon className="fc-event-chip__icon" aria-hidden />
        <span className="fc-event-chip__time fc-event-chip__time--compact">
          {compactStart}
        </span>
        <span className="fc-event-chip__name fc-event-chip__name--short">
          {shortName}
        </span>
        <span className="fc-event-chip__name fc-event-chip__name--full">
          {fullName}
        </span>
      </div>
      <div className="fc-event-chip__secondary">
        <span className="fc-event-chip__range">{rangeLabel}</span>
        {doctorName ? (
          <span className="fc-event-chip__doctor" title={doctorName}>
            {formatDoctorLabel(doctorName, { short: true })}
          </span>
        ) : null}
        {appt?.service?.name ? (
          <span className="fc-event-chip__service" title={appt.service.name}>
            {appt.service.name}
          </span>
        ) : null}
      </div>
    </div>
  );
}
