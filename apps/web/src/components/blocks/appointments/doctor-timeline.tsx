'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Plus,
  Stethoscope,
  Users,
  Video,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/services/appointments.service';
import { ClinicStaffMember } from '@/services/clinics.service';
import { STATUS_COLORS, STATUS_CONFIG } from './status-badge';
import { AppointmentStatusSelect } from './appointment-status-select';
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
  type PositionedAppt,
  type TimelineDoctor,
} from './timeline-layout';
import { EventPreview, type EventPreviewState } from './event-preview';
import { rectFromElement } from './popover-position';
import { SoftTip } from '@/components/primitives/soft-tip';
import { cn } from '@/lib/utils';
import { TimelineSkeleton } from '@/components/primitives/skeleton-presets';
import { useNow } from '@/hooks/use-now';
import { ViewFocusToggle } from './view-focus';

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
  const accent = STATUS_COLORS[appt.status];
  const statusCfg = STATUS_CONFIG[appt.status];
  const density = densityFromHeight(height);
  const isCancelled = appt.status === 'cancelled';
  const doctorName = doctorDisplayName(doctor?.name ?? appt.doctor?.name);
  const fullName = patientDisplayName(appt);
  const timeLabel = `${formatApptStartAmPm(appt)} · ${appt.durationMins}m`;
  const narrow = widthPct < 34;
  const tip = formatApptTip(appt, { doctorName });
  const gapPx = widthPct < 50 ? 5 : 4;
  const blockH = Math.max(height - 2, 28);

  const openFromEvent = (e: React.MouseEvent | React.KeyboardEvent, el: HTMLElement) => {
    const x = 'clientX' in e ? e.clientX : el.getBoundingClientRect().left + el.clientWidth / 2;
    const y = 'clientY' in e ? e.clientY : el.getBoundingClientRect().top + el.clientHeight / 2;
    onOpen(appt, el, x, y);
  };

  return (
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
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - ${gapPx}px)`,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        backgroundColor: `color-mix(in oklch, ${accent} 9%, var(--card))`,
      }}
      title={tip}
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
          {density === 'xs' || density === 'sm' || narrow ? (
            <span
              className={cn('size-1.5 shrink-0 rounded-full', statusCfg.dotClassName)}
              title={statusCfg.label}
              aria-hidden
            />
          ) : density === 'lg' ? (
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AppointmentStatusSelect appointment={appt} compact />
            </div>
          ) : null}
        </div>

        {density !== 'xs' && (
          <p className="truncate text-[11px] font-medium leading-4 tabular-nums text-muted-foreground">
            {timeLabel}
          </p>
        )}

        {density === 'md' && !narrow && (
          <p
            className="flex min-w-0 items-center gap-1.5 truncate text-[11px] leading-4 text-muted-foreground"
            title={formatDoctorLabel(doctorName)}
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
              title={formatDoctorLabel(doctorName)}
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
                  title={appt.service.name}
                >
                  <Stethoscope className="size-2.5 shrink-0 text-primary" />
                  <span className="truncate">{appt.service.name}</span>
                </span>
              ) : null}
              {appt.sessionType === 'online' ? (
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <Video className="size-2.5 shrink-0" />
                  Online
                </span>
              ) : appt.room ? (
                <span
                  className="inline-flex min-w-0 items-center gap-1 truncate font-medium"
                  title={appt.room.name}
                >
                  <DoorOpen className="size-2.5 shrink-0" />
                  <span className="truncate">{appt.room.name}</span>
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
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
        name: d.name,
        color: TIMELINE_DOCTOR_COLORS[i++ % TIMELINE_DOCTOR_COLORS.length],
      });
    });
    appointments?.forEach((a) => {
      if (a.doctor && !map.has(a.doctorId)) {
        map.set(a.doctorId, {
          id: a.doctorId,
          name: a.doctor.name ?? 'Doctor',
          color: TIMELINE_DOCTOR_COLORS[map.size % TIMELINE_DOCTOR_COLORS.length],
        });
      }
    });
    return map;
  }, [doctors, appointments]);

  const allDoctors = useMemo(() => Array.from(doctorMap.values()), [doctorMap]);

  const dayAppts = useMemo(() => {
    if (!appointments) return [];
    const d = new Date(selectedDate);
    const start = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const end = new Date(d.setHours(23, 59, 59, 999)).getTime();
    return appointments.filter((a) => {
      const t = new Date(a.scheduledAt).getTime();
      return t >= start && t <= end;
    });
  }, [appointments, selectedDate]);

  const visibleAppts = useMemo(
    () =>
      activeDoctorId === 'all'
        ? dayAppts
        : dayAppts.filter((a) => a.doctorId === activeDoctorId),
    [dayAppts, activeDoctorId],
  );

  const positioned = useMemo(
    () => layoutTimelineAppts(visibleAppts, doctorMap),
    [visibleAppts, doctorMap],
  );

  const nowTop = useMemo(() => {
    if (!isToday) return null;
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < TIMELINE_START_HOUR || h >= TIMELINE_END_HOUR) {
      return null;
    }
    return ((h - TIMELINE_START_HOUR) * 60 + m) * (TIMELINE_HOUR_HEIGHT / 60);
  }, [isToday, now]);

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
      selectedDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [selectedDate],
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
          <Users className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-bold">No doctors found</h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Add staff or book the first appointment to populate the timeline.
        </p>
        <Button size="sm" className="mt-4" onClick={() => {
          const s = new Date(selectedDate); s.setHours(9, 0, 0, 0); onSelectSlot(s);
        }}>
          <Plus className="mr-1.5 size-3.5" /> Book Appointment
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border bg-card shadow-xs',
        focused
          ? 'h-full min-h-0 rounded-none border-0'
          : 'card-aura rounded-2xl',
      )}
    >

      <div className="flex flex-col gap-2 border-b bg-muted/20 px-2.5 py-2 sm:px-3">
        <div className="flex flex-wrap items-center justify-between gap-2">

          <div className="flex min-w-0 items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={goToday} disabled={isToday}
              className="h-8 px-2.5 text-xs font-semibold active:scale-95">
              <CalendarDays className="size-3.5" />
              <span className="ml-1 hidden sm:inline">Today</span>
            </Button>
            <div className="flex items-center overflow-hidden rounded-lg border bg-background/60">
              <button type="button" onClick={() => shiftDate(-1)} aria-label="Previous day"
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => shiftDate(1)} aria-label="Next day"
                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95">
                <ChevronRight className="size-4" />
              </button>
            </div>
            <span className="truncate text-xs font-bold text-foreground sm:text-sm">{dateLabel}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:gap-3">
              <span className="flex items-center gap-1">
                <Users className="size-3.5 text-primary" />
                {allDoctors.length} dr{allDoctors.length !== 1 ? 's' : ''}
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="hidden sm:inline">
                {dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ViewFocusToggle />
          </div>
        </div>

        {allDoctors.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveDoctorId('all')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95',
                activeDoctorId === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              All doctors
            </button>
            {allDoctors.map((doc) => {
              const full = doctorDisplayName(doc.name);
              const count = dayAppts.filter((a) => a.doctorId === doc.id).length;
              return (
                <SoftTip key={doc.id} label={formatDoctorLabel(full)} side="bottom">
                  <button
                    type="button"
                    onClick={() => setActiveDoctorId(doc.id)}
                    aria-label={formatDoctorLabel(full)}
                    className={cn(
                      'inline-flex max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 sm:max-w-[12rem]',
                      activeDoctorId === doc.id
                        ? 'bg-foreground text-background shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: doc.color }}
                    />
                    <span className="hidden truncate sm:inline">{full}</span>
                    <span className="truncate sm:hidden">
                      {formatDoctorLabel(full, { short: true }).replace(/^Dr\.\s/, '')}
                    </span>
                    <span className="rounded-full bg-background/25 px-1 text-[10px] font-bold">
                      {count}
                    </span>
                  </button>
                </SoftTip>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        onClick={handleGridClick}
        className={cn(
          'relative overflow-auto overscroll-contain cursor-pointer',
          focused && 'min-h-0 flex-1',
        )}
        style={
          focused
            ? undefined
            : { maxHeight: 'min(70dvh, calc(100dvh - 14rem))', minHeight: 'min(360px, 55dvh)' }
        }
      >
        <div className="relative flex min-w-[20rem]" style={{ height: `${TIMELINE_TOTAL_HEIGHT}px` }}>

          <div className="sticky left-0 z-10 w-12 shrink-0 border-r bg-card/95 backdrop-blur-md">
            {TIMELINE_HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-0 flex w-12 items-start justify-end pr-1.5 text-[10px] font-semibold text-muted-foreground/60"
                style={{ top: `${(h - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT}px`, height: `${TIMELINE_HOUR_HEIGHT}px` }}
              >
                <span className="mt-0.5">{formatHourLabel(h)}</span>
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            {TIMELINE_HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/30"
                style={{ top: `${(h - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT}px` }}
              />
            ))}
            {TIMELINE_HOURS.map((h) => (
              <div
                key={`${h}h`}
                className="absolute left-0 right-0 border-t border-border/15 border-dashed"
                style={{ top: `${(h - TIMELINE_START_HOUR) * TIMELINE_HOUR_HEIGHT + TIMELINE_HOUR_HEIGHT / 2}px` }}
              />
            ))}

            {nowTop !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${nowTop}px` }}
              >
                <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] -ml-1 animate-pulse" />
                <div className="h-0.5 flex-1 bg-rose-500/70" />
              </div>
            )}

            {positioned.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-3">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-center text-[11px] font-semibold text-primary sm:px-4 sm:text-xs">
                  <Plus className="size-3.5 shrink-0" />
                  <span className="sm:hidden">Tap to book</span>
                  <span className="hidden sm:inline">Click anywhere to book</span>
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
