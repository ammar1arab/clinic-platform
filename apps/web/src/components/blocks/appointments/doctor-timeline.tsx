'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Appointment } from '@/services/appointments.service';
import { ClinicStaffMember } from '@/services/clinics.service';
import { STATUS_COLORS, getStatusConfig, StatusBadgeBlock } from './status-badge';
import { AppointmentStatusSelect } from './appointment-status-select';
import { DoctorCombobox } from './doctor-combobox';
import {
  patientDisplayName,
  doctorDisplayName,
  formatApptStartAmPm,
  formatApptTip,
  formatDoctorLabel,
  formatHourLabel,
  densityFromHeight,
  isSameDay,
} from './appointment-display';
import {
  layoutTimelineAppts,
  TIMELINE_DOCTOR_COLORS,
  TIMELINE_HOUR_HEIGHT,
  TIMELINE_HOURS,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  TIMELINE_TOTAL_HEIGHT,
  TIMELINE_PX_PER_MIN,
  type PositionedAppt,
  type TimelineDoctor,
} from './timeline-layout';
import { EventPreview, type EventPreviewState } from './event-preview';
import { rectFromElement } from './popover-position';
import {
  SoftTip,
  TimelineSkeleton,
} from '@/components/primitives';
import { cn } from '@/lib/utils';
import { useNow } from '@/hooks/shared/use-now';
import { ViewFocusToggle } from './view-focus';
import { IconAdd, IconChevronLeft, IconChevronRight, IconOnline, IconPatients, IconRoom, IconService, IconVisit } from '@/constants/icons';
import { useLanguage } from '@/providers';

interface Props {
  appointments: Appointment[] | undefined;
  doctors: ClinicStaffMember[] | undefined;
  isLoading: boolean;
  focused?: boolean;
  onSelectSlot: (date: Date, doctorId?: string) => void;
  onEventClick: (appointment: Appointment) => void;
}

function TimelineEventBlock({
  appt,
  doctor,
  top,
  height,
  leftPct,
  widthPct,
  onOpen,
}: PositionedAppt & {
  onOpen: (appt: Appointment, el: HTMLElement, x: number, y: number) => void;
}) {
  const { t, lang } = useLanguage();
  const accent = STATUS_COLORS[appt.status];
  const statusCfg = getStatusConfig(t)[appt.status];
  const density = densityFromHeight(height);
  const isCancelled = appt.status === 'cancelled';
  const doctorName = doctorDisplayName(doctor?.name ?? appt.doctor?.name, lang);
  const fullName = patientDisplayName(appt, lang);
  const timeLabel = `${formatApptStartAmPm(appt, lang)} · ${appt.durationMins}m`;
  const narrow = widthPct < 34;
  const tip = formatApptTip(appt, { doctorName, lang });
  const gapPx = widthPct < 50 ? 5 : 4;
  const blockH = Math.max(height - 2, 28);

  const openFromEvent = (e: React.MouseEvent | React.KeyboardEvent, el: HTMLElement) => {
    const x = 'clientX' in e ? e.clientX : el.getBoundingClientRect().left + el.clientWidth / 2;
    const y = 'clientY' in e ? e.clientY : el.getBoundingClientRect().top + el.clientHeight / 2;
    onOpen(appt, el, x, y);
  };

  return (
    <SoftTip label={tip}>
      <div
        data-appt
        role="button"
        tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        openFromEvent(e, e.currentTarget);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openFromEvent(e, e.currentTarget);
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
              density === 'xs' ? 'text-[11px] leading-4' : 'text-xs leading-4 sm:text-[13px] sm:leading-5',
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
          ) : (
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AppointmentStatusSelect appointment={appt} compact />
            </div>
          )}
        </div>

        {density !== 'xs' && (
          <p className="truncate text-[11px] font-medium leading-4 tabular-nums text-muted-foreground">
            {timeLabel}
          </p>
        )}

        {density === 'md' && !narrow && (
          <p
            className="flex min-w-0 items-center gap-1.5 truncate text-[11px] leading-4 text-muted-foreground"
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
              className="flex min-w-0 items-center gap-1.5 truncate text-[11px] leading-4 text-muted-foreground"
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
            <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-4 text-muted-foreground">
              {appt.service ? (
                <span
                  className="flex min-w-0 max-w-full items-center gap-1 truncate font-medium text-foreground/75"
                >
                  <IconService className="size-2.5 shrink-0 text-primary" />
                  <span className="truncate">{(lang === 'ar' && appt.service.nameAr) || appt.service.name}</span>
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
                  <span className="truncate">{(lang === 'ar' && appt.room.nameAr) || appt.room.name}</span>
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
  onSelectSlot,
  onEventClick,
}: Props) {
  const { t, lang, dir } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [activeDoctorId, setActiveDoctorId] = useState<string>('all');
  const [preview, setPreview] = useState<EventPreviewState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow(30_000);
  const isToday = isSameDay(selectedDate, now);

  const openPreview = useCallback(
    (appt: Appointment, el: HTMLElement, x: number, y: number) => {
      setPreview({
        appointment: appt,
        x,
        y,
        anchor: rectFromElement(el, x, y),
      });
    },
    [],
  );

  const doctorMap = useMemo<Map<string, TimelineDoctor>>(() => {
    const map = new Map<string, TimelineDoctor>();
    let i = 0;
    doctors?.forEach((d) => {
      map.set(d.id, {
        id: d.id,
        name: lang === 'ar' && (d as { nameAr?: string }).nameAr ? (d as { nameAr?: string }).nameAr! : d.name,
        color: TIMELINE_DOCTOR_COLORS[i++ % TIMELINE_DOCTOR_COLORS.length],
      });
    });
    appointments?.forEach((a) => {
      const doc = a.doctor;
      if (doc?.id && !map.has(doc.id)) {
        map.set(doc.id, {
          id: doc.id,
          name: lang === 'ar' && (doc as { nameAr?: string }).nameAr ? (doc as { nameAr?: string }).nameAr! : doc.name,
          color: TIMELINE_DOCTOR_COLORS[i++ % TIMELINE_DOCTOR_COLORS.length],
        });
      }
    });
    return map;
  }, [doctors, appointments, lang]);

  const allDoctors = useMemo(() => Array.from(doctorMap.values()), [doctorMap]);

  const dayAppts = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((a) => {
      const parsed = new Date(a.scheduledAt);
      if (isNaN(parsed.getTime()) || !isSameDay(parsed, selectedDate)) return false;
      if (activeDoctorId !== 'all') {
        const docId = a.doctor?.id ?? a.doctorId;
        return docId === activeDoctorId;
      }
      return true;
    });
  }, [appointments, selectedDate, activeDoctorId]);

  const positioned = useMemo(
    () => layoutTimelineAppts(dayAppts, doctorMap),
    [dayAppts, doctorMap],
  );

  const nowTop = useMemo(() => {
    if (!isToday) return null;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, currentMin - TIMELINE_START_HOUR * 60) * TIMELINE_PX_PER_MIN;
  }, [isToday, now]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (nowTop !== null) {
      el.scrollTop = Math.max(0, nowTop - 120);
    } else {
      el.scrollTop = (9 - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT;
    }
  }, [selectedDate, isToday, nowTop]);

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
      selectedDate.toLocaleDateString(lang === 'ar' ? 'ar' : undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [selectedDate, lang],
  );

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-appt]')) return;
      setPreview(null);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top + e.currentTarget.scrollTop;
      const pxPerMin = TIMELINE_HOUR_HEIGHT / 60;
      const maxMins = TIMELINE_HOURS.length * 60 - 1;
      const totalMin =
        TIMELINE_START_HOUR * 60 +
        Math.max(0, Math.min(Math.floor(offsetY / pxPerMin), maxMins));
      const slot = new Date(selectedDate);
      slot.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
      onSelectSlot(slot, activeDoctorId === 'all' ? undefined : activeDoctorId);
    },
    [selectedDate, activeDoctorId, onSelectSlot],
  );

  if (isLoading) return <TimelineSkeleton columns={3} />;

  if (allDoctors.length === 0) {
    return (
      <div className="card-aura flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center shadow-xs">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted/60">
          <IconPatients className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-bold">{t.appointments.noDoctorsFound}</h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {t.appointments.noDoctorsDesc}
        </p>
        <Button size="sm" className="mt-4" onClick={() => {
          const s = new Date(selectedDate); s.setHours(9, 0, 0, 0); onSelectSlot(s);
        }}>
          <IconAdd className="me-1.5 size-3.5" /> {t.appointments.bookAppointment}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border bg-card shadow-xs',
        focused
          ? 'h-0 min-h-0 flex-1 rounded-none border-0'
          : 'card-aura min-h-0 flex-1 rounded-2xl',
      )}
    >

      <div className="flex flex-col gap-2 border-b bg-muted/20 px-2.5 py-2 sm:px-3">
        <div className="flex flex-wrap items-center justify-between gap-2">

          <div className="flex min-w-0 items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={goToday} disabled={isToday}
              className="h-8 px-2.5 text-xs font-semibold active:scale-95">
              <IconVisit className="size-3.5" />
              <span className="ms-1 hidden sm:inline">{t.appointments.today}</span>
            </Button>
            <div className="flex items-center overflow-hidden rounded-lg border bg-background/60">
              <button type="button" onClick={() => shiftDate(-1)} aria-label={t.appointments.previousDay}
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95">
                {dir === 'rtl' ? <IconChevronRight className="size-4" /> : <IconChevronLeft className="size-4" />}
              </button>
              <button type="button" onClick={() => shiftDate(1)} aria-label={t.appointments.nextDay}
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95">
                {dir === 'rtl' ? <IconChevronLeft className="size-4" /> : <IconChevronRight className="size-4" />}
              </button>
            </div>
            <span className="truncate text-xs font-bold text-foreground sm:text-sm">{dateLabel}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:gap-3">
              <span className="flex items-center gap-1">
                <IconPatients className="size-3.5 text-primary" />
                {allDoctors.length} {t.appointments.doctorsCount}
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="hidden sm:inline">
                {dayAppts.length} {t.appointments.appts}
              </span>
            </div>
            <ViewFocusToggle />
          </div>
        </div>

        {allDoctors.length > 0 && (
          <DoctorCombobox
            doctors={allDoctors}
            value={activeDoctorId}
            onChange={setActiveDoctorId}
            extraOption={{ value: 'all', label: t.appointments.allDoctors }}
            placeholder={t.appointments.selectDoctor}
            className="w-full max-w-md"
            size="sm"
          />
        )}
      </div>

      <div
        ref={scrollRef}
        onClick={handleGridClick}
        className={cn(
          'relative overflow-auto overscroll-contain cursor-pointer',
          focused && 'h-0 min-h-0 flex-1',
        )}
        style={
          focused
            ? undefined
            : { maxHeight: 'min(70dvh, calc(100dvh - 14rem))', minHeight: 'min(360px, 55dvh)' }
        }
      >
        <div className="relative flex min-w-[20rem]" style={{ height: `${TIMELINE_TOTAL_HEIGHT}px` }}>

          <div className="sticky start-0 z-10 w-12 shrink-0 border-e bg-card/95 backdrop-blur-md">
            {TIMELINE_HOURS.map((h) => (
              <div
                key={h}
                className="absolute end-0 flex w-12 items-start justify-end pe-1.5 text-[10px] font-semibold text-muted-foreground/60"
                style={{ top: `${(h - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT}px`, height: `${TIMELINE_HOUR_HEIGHT}px` }}
              >
                <span className="mt-0.5">{formatHourLabel(h, lang)}</span>
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            {TIMELINE_HOURS.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-border/30"
                style={{ top: `${(h - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT}px` }}
              />
            ))}
            {TIMELINE_HOURS.map((h) => (
              <div
                key={`${h}h`}
                className="absolute inset-x-0 border-t border-border/15 border-dashed"
                style={{ top: `${(h - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT + TIMELINE_HOUR_HEIGHT / 2}px` }}
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
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-center text-[11px] font-semibold text-primary sm:px-4 sm:text-xs">
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
              />
            ))}
          </div>
        </div>
      </div>

      {preview ? (
        <EventPreview
          preview={preview}
          placement="auto"
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
