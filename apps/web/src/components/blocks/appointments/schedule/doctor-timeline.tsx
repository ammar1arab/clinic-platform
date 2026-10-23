'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Button, Skeleton } from '@/components/ui';
import { Appointment } from '@/services/appointments.service';
import { ClinicStaffMember } from '@/services/clinics.service';
import { STATUS_COLORS, getStatusConfig, StatusBadgeBlock } from '../shared/status-badge';
import { AppointmentStatusSelect } from '../shared/appointment-status-select';
import { createPortal } from 'react-dom';
import { DoctorCombobox } from '../shared/doctor-combobox';
import {
  patientDisplayName,
  doctorDisplayName,
  formatApptStartAmPm,
  formatApptTip,
  formatDoctorLabel,
  formatHourLabel,
  densityFromHeight,
  isSameDay,
} from '../shared/appointment-display';
import {
  layoutTimelineAppts,
  TIMELINE_DOCTOR_COLORS,
  TIMELINE_HOUR_HEIGHT,
  TIMELINE_PX_PER_MIN,
  type PositionedAppt,
  type TimelineDoctor,
} from './timeline-layout';
import {
  AppointmentPopover,
  popoverAnchorFromElement,
  type AppointmentPopoverState,
  type PopoverAnchorRect,
} from './appointment-popovers';
import {
  SoftTip,
  TimelineSkeleton,
  EmptyState,
} from '@/components/primitives';
import { cn } from '@/lib/utils';
import { useNow } from '@/hooks/shared/use-now';
import { IconAdd, IconCalendar, IconChevronLeft, IconChevronRight, IconOnline, IconPatients, IconRoom, IconService } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { useClinicHours } from '@/hooks/api/use-clinic';
import { parseClock } from '@/lib/datetime';

interface Props {
  appointments: Appointment[] | undefined;
  doctors: ClinicStaffMember[] | undefined;
  isLoading: boolean;
  focused?: boolean;
  canManageAppointments?: boolean;
  toolbarSlot?: HTMLElement | null;
  doctorId?: string;
  onDoctorChange?: (id: string) => void;
  onSelectSlot: (date: Date, doctorId?: string) => void;
  onEventClick: (appointment: Appointment) => void;
}

function clockMinutes(value: string, fallback: number) {
  const parts = parseClock(value);
  return parts ? parts.hours * 60 + parts.minutes : fallback;
}

function TimelineEventBlock({
  appt,
  doctor,
  top,
  height,
  leftPct,
  widthPct,
  onOpen,
  canManageAppointments,
}: PositionedAppt & {
  onOpen: (appt: Appointment, anchor: PopoverAnchorRect) => void;
  canManageAppointments: boolean;
}) {
  const { t, lang } = useLanguage();
  const accent = STATUS_COLORS[appt.status];
  const statusCfg = getStatusConfig(t)[appt.status];
  const density = densityFromHeight(height);
  const isCancelled = appt.status === 'cancelled';
  const doctorName = doctorDisplayName(appt.doctor ?? doctor, lang);
  const fullName = patientDisplayName(appt, lang);
  const timeLabel = `${formatApptStartAmPm(appt, lang)} · ${appt.durationMins}${t.appointments.minutesShort}`;
  const narrow = widthPct < 34;
  const tip = formatApptTip(appt, { doctorName, lang });
  const gapPx = widthPct < 50 ? 5 : 4;
  const blockH = Math.max(height - 2, 28);

  return (
    <SoftTip label={tip}>
      <div
        data-appt
        role="button"
        tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(appt, popoverAnchorFromElement(e.currentTarget));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onOpen(appt, popoverAnchorFromElement(e.currentTarget));
        }
      }}
      className={cn(
        'group absolute z-10 flex overflow-hidden rounded-lg border border-border/70 bg-card shadow-xs',
        'cursor-pointer outline-none transition-[box-shadow,transform,border-color,z-index] duration-150',
        'hover:z-30 hover:border-primary/40 hover:shadow-md',
        'focus-visible:z-30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'active:scale-[0.985]',
        isCancelled && 'opacity-55',
      )}
      style={{
        top: `${top + 1}px`,
        height: `${blockH}px`,
        insetInlineStart: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - ${gapPx}px)`,
        borderInlineStartWidth: 3,
        borderInlineStartColor: accent,
        backgroundColor: `color-mix(in oklch, ${accent} 9%, var(--card))`,
      }}
    >
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden',
          density === 'xs' && 'gap-0 px-1.5 py-1',
          density === 'sm' && 'gap-0.5 px-2 py-1',
          density === 'md' && 'gap-1 px-2 py-1.5',
          density === 'lg' && 'justify-start gap-1 px-2.5 py-2',
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              'min-w-0 flex-1 truncate font-semibold text-foreground',
              density === 'xs' ? 'text-2xs leading-4' : 'text-xs leading-4 sm:text-[13px] sm:leading-5',
              isCancelled && 'line-through',
            )}
          >
            {fullName}
          </p>
          {density === 'xs' || narrow ? (
            <span
              className={cn('size-1.5 shrink-0 rounded-full', statusCfg.dotClassName)}
              aria-hidden
            />
          ) : density === 'sm' || density === 'md' ? (
            <StatusBadgeBlock status={appt.status} compact tip={false} />
          ) : canManageAppointments ? (
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AppointmentStatusSelect appointment={appt} compact />
            </div>
          ) : (
            <StatusBadgeBlock status={appt.status} compact tip={false} />
          )}
        </div>

        {density !== 'xs' && (
          <p className="truncate text-2xs font-medium leading-4 tabular-nums text-muted-foreground">
            {timeLabel}
          </p>
        )}

        {density === 'md' && !narrow && (
          <p
            className="flex min-w-0 items-center gap-1.5 truncate text-2xs leading-4 text-muted-foreground"
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: doctor?.color ?? accent }}
              aria-hidden
            />
            <span className="truncate font-medium text-foreground/80">
              {formatDoctorLabel(doctorName, { short: true })}
            </span>
          </p>
        )}

        {density === 'lg' && !narrow && (
          <>
            <p
              className="flex min-w-0 items-center gap-1.5 truncate text-2xs leading-4 text-muted-foreground"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: doctor?.color ?? accent }}
                aria-hidden
              />
              <span className="truncate font-medium text-foreground/80">
                {formatDoctorLabel(doctorName)}
              </span>
            </p>
            <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-2xs leading-4 text-muted-foreground">
              {appt.service ? (
                <span
                  className="flex min-w-0 max-w-full items-center gap-1 truncate font-medium text-foreground/75"
                >
                  <IconService className="size-2.5 shrink-0 text-primary" />
                  <span className="truncate">{getBilingualName(appt.service.name, appt.service.nameAr, lang)}</span>
                </span>
              ) : null}
              {appt.sessionType === 'online' ? (
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <IconOnline className="size-2.5 shrink-0" />
                  {t.appointments.online}
                </span>
              ) : appt.room ? (
                <span
                  className="inline-flex min-w-0 items-center gap-1 truncate font-medium"
                >
                  <IconRoom className="size-2.5 shrink-0" />
                  <span className="truncate">{getBilingualName(appt.room.name, appt.room.nameAr, lang)}</span>
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
      </div>
    </SoftTip>
  );
}

export function DoctorTimeline({
  appointments,
  doctors,
  isLoading,
  focused = false,
  canManageAppointments = true,
  toolbarSlot,
  doctorId,
  onDoctorChange,
  onSelectSlot,
  onEventClick,
}: Props) {
  const { t, lang } = useLanguage();
  const clinicHours = useClinicHours();
  const startHour = Math.floor(clockMinutes(clinicHours.start, 8 * 60) / 60);
  const endHour = Math.max(startHour + 1, Math.ceil(clockMinutes(clinicHours.end, 20 * 60) / 60));
  const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => i + startHour), [startHour, endHour]);
  const totalHeight = hours.length * TIMELINE_HOUR_HEIGHT;
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [localDoctorId, setLocalDoctorId] = useState<string>('all');
  const activeDoctorId = doctorId ?? localDoctorId;
  const setActiveDoctorId = onDoctorChange ?? setLocalDoctorId;
  const [appointmentPopover, setAppointmentPopover] =
    useState<AppointmentPopoverState | null>(null);
  const now = useNow(30_000);
  const isToday = isSameDay(selectedDate, now);

  const openPreview = useCallback((appointment: Appointment, anchor: PopoverAnchorRect) => {
    setAppointmentPopover({ appointment, anchor });
  }, []);

  const doctorMap = useMemo<Map<string, TimelineDoctor>>(() => {
    const map = new Map<string, TimelineDoctor>();
    let i = 0;
    doctors?.forEach((d) => {
      map.set(d.id, {
        id: d.id,
        name: getBilingualName(d.name, d.nameAr, lang),
        color: TIMELINE_DOCTOR_COLORS[i++ % TIMELINE_DOCTOR_COLORS.length],
      });
    });
    appointments?.forEach((a) => {
      const doc = a.doctor;
      if (doc?.id && !map.has(doc.id)) {
        map.set(doc.id, {
          id: doc.id,
          name: getBilingualName(doc.name, doc.nameAr, lang),
          color: TIMELINE_DOCTOR_COLORS[i++ % TIMELINE_DOCTOR_COLORS.length],
        });
      }
    });
    return map;
  }, [doctors, appointments, lang]);

  const allDoctors = useMemo(() => Array.from(doctorMap.values()), [doctorMap]);

  const dayAppointmentsAll = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((a) => {
      const parsed = new Date(a.scheduledAt);
      return !isNaN(parsed.getTime()) && isSameDay(parsed, selectedDate);
    });
  }, [appointments, selectedDate]);

  const doctorDayCounts = useMemo(() => {
    const counts: Record<string, number> = { all: dayAppointmentsAll.length };
    for (const a of dayAppointmentsAll) {
      const docId = a.doctor?.id ?? a.doctorId;
      if (!docId) continue;
      counts[docId] = (counts[docId] ?? 0) + 1;
    }
    return counts;
  }, [dayAppointmentsAll]);

  const dayAppts = useMemo(() => {
    if (activeDoctorId === 'all') return dayAppointmentsAll;
    return dayAppointmentsAll.filter((a) => {
      const docId = a.doctor?.id ?? a.doctorId;
      return docId === activeDoctorId;
    });
  }, [dayAppointmentsAll, activeDoctorId]);

  const positioned = useMemo(
    () => layoutTimelineAppts(dayAppts, doctorMap, startHour),
    [dayAppts, doctorMap, startHour],
  );

  const nowTop = useMemo(() => {
    if (!isToday) return null;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, currentMin - startHour * 60) * TIMELINE_PX_PER_MIN;
  }, [isToday, now, startHour]);

  const attachTimelineScroll = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      if (isToday) {
        const current = new Date();
        const marker =
          (current.getHours() * 60 + current.getMinutes() - startHour * 60) *
          TIMELINE_PX_PER_MIN;
        el.scrollTop = Math.max(0, marker - 120);
        return;
      }
      el.scrollTop = Math.max(0, 9 - startHour) * TIMELINE_HOUR_HEIGHT;
    },
    [isToday, startHour],
  );

  const shiftDate = useCallback((delta: number) => {
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() + delta);
      return n;
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  }, []);

  const dateLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString(lang, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [selectedDate, lang],
  );

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canManageAppointments || (e.target as HTMLElement).closest('[data-appt]')) return;
      setAppointmentPopover(null);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top + e.currentTarget.scrollTop;
      const pxPerMin = TIMELINE_HOUR_HEIGHT / 60;
      const maxMins = hours.length * 60 - 1;
      const totalMin =
        startHour * 60 +
        Math.max(0, Math.min(Math.floor(offsetY / pxPerMin), maxMins));
      const slot = new Date(selectedDate);
      slot.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
      onSelectSlot(slot, activeDoctorId === 'all' ? undefined : activeDoctorId);
    },
    [canManageAppointments, selectedDate, activeDoctorId, onSelectSlot, hours.length, startHour],
  );

  const slot = toolbarSlot;
  const doctorPicker = (
    <DoctorCombobox
      doctors={allDoctors}
      value={activeDoctorId}
      onChange={setActiveDoctorId}
      counts={doctorDayCounts}
      extraOption={{ value: 'all', label: t.appointments.allDoctors }}
      placeholder={t.appointments.selectDoctor}
      className={slot ? 'w-full' : 'w-full max-w-md'}
      size="sm"
    />
  );

  if (isLoading) {
    return (
      <>
        {slot ? createPortal(<Skeleton className="h-8 w-full rounded-lg" />, slot) : null}
        <TimelineSkeleton />
      </>
    );
  }

  if (allDoctors.length === 0) {
    return (
    <EmptyState
      icon={IconPatients}
      title={t.appointments.noDoctorsFound}
      description={t.appointments.noDoctorsDesc}
      className="page-fill px-5 py-10"
      action={canManageAppointments ? (
        <Button size="sm" onClick={() => {
          const slot = new Date(selectedDate);
          slot.setHours(9, 0, 0, 0);
          onSelectSlot(slot);
        }}>
          <IconAdd className="me-1.5 size-3.5" /> {t.appointments.bookAppointment}
        </Button>
      ) : undefined}
    />
    );
  }

  return (
    <div
      data-schedule-host=""
      className={cn(
        'relative page-fill flex-1 min-h-0 overflow-hidden bg-card',
        'card-aura rounded-xl border',
        focused ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5',
      )}
    >

      {slot ? createPortal(doctorPicker, slot) : focused || toolbarSlot !== undefined ? null : <div className="mb-2 shrink-0">{doctorPicker}</div>}
      <div className="mb-2 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-3">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" aria-label={t.appointments.previousDay} onClick={() => shiftDate(-1)}>
            <IconChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label={t.appointments.nextDay} onClick={() => shiftDate(1)}>
            <IconChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
        <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
          <span className="flex items-center gap-1">
            <IconPatients className="size-3.5 text-primary" />
            {allDoctors.length} {t.appointments.doctorsCount}
          </span>
          <span className="h-3 w-px bg-border" />
          <span>{dayAppts.length} {t.appointments.appts}</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1 max-sm:col-start-3 sm:gap-2">
          <h2 className="min-w-0 truncate text-xs font-semibold sm:text-sm" title={dateLabel}>{dateLabel}</h2>
          <SoftTip label={t.appointments.today}>
            <Button type="button" variant="ghost" size="icon-xs" onClick={goToday} disabled={isToday} aria-label={t.appointments.today}>
              <IconCalendar className="size-3.5" />
            </Button>
          </SoftTip>
        </div>
      </div>

      <div
        ref={attachTimelineScroll}
        onClick={handleGridClick}
        className="relative page-fill flex-1 min-h-0 cursor-pointer overflow-auto overscroll-contain rounded-lg border border-border/60"
      >
        <div className="relative flex min-w-[20rem]" style={{ height: `${totalHeight}px` }}>

          <div className="sticky start-0 z-10 w-12 shrink-0 border-e bg-card/95 backdrop-blur-md">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute end-0 flex w-12 items-start justify-end pe-1.5 text-2xs font-semibold text-muted-foreground/60"
                style={{ top: `${(h - startHour) * TIMELINE_HOUR_HEIGHT}px`, height: `${TIMELINE_HOUR_HEIGHT}px` }}
              >
                <span className="mt-0.5">{formatHourLabel(h, lang)}</span>
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-border/30"
                style={{ top: `${(h - startHour) * TIMELINE_HOUR_HEIGHT}px` }}
              />
            ))}
            {hours.map((h) => (
              <div
                key={`${h}h`}
                className="absolute inset-x-0 border-t border-border/15 border-dashed"
                style={{ top: `${(h - startHour) * TIMELINE_HOUR_HEIGHT + TIMELINE_HOUR_HEIGHT / 2}px` }}
              />
            ))}

            {nowTop !== null && (
              <div
                className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${nowTop}px` }}
              >
                <div className="size-2 -ms-1 animate-pulse rounded-full bg-error shadow-[0_0_6px_color-mix(in_oklch,var(--color-error)_70%,transparent)]" />
                <div className="h-0.5 flex-1 bg-error/70" />
              </div>
            )}

            {positioned.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-3">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-center text-2xs font-semibold text-primary sm:px-4 sm:text-xs">
                  <IconAdd className="size-3.5 shrink-0" />
                  <span className="sm:hidden">{t.appointments.tapToBook}</span>
                  <span className="hidden sm:inline">{t.appointments.clickAnywhereToBook}</span>
                </span>
              </div>
            )}

            {positioned.map((item) => (
              <TimelineEventBlock
                key={item.appt.id}
                {...item}
                onOpen={openPreview}
                canManageAppointments={canManageAppointments}
              />
            ))}
          </div>
        </div>
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
