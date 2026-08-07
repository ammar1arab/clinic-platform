'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
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
import { STATUS_COLORS } from './status-colors';
import { AppointmentStatusSelect } from './appointment-status-select';
import { patientDisplayName, formatApptTimeRange, formatApptStartAmPm } from './calendar-time';
import { cn } from '@/lib/utils';
import { TimelineSkeleton } from '@/components/primitives/skeleton-presets';
import { useNow } from '@/hooks/use-now';

/* ─── Constants ──────────────────────────────────────────────────────────────── */
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_MINS = (END_HOUR - START_HOUR) * 60;
const PX_PER_MIN = 2;
const TOTAL_HEIGHT = TOTAL_MINS * PX_PER_MIN;
const HOUR_HEIGHT = 60 * PX_PER_MIN;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const DOCTOR_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface TimelineDoctor {
  id: string;
  name: string;
  color: string;
}

interface PositionedAppt {
  appt: Appointment;
  doctor: TimelineDoctor | undefined;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

interface Props {
  appointments: Appointment[] | undefined;
  doctors: ClinicStaffMember[] | undefined;
  isLoading: boolean;
  onSelectSlot: (date: Date, doctorId?: string) => void;
  onEventClick: (appointment: Appointment) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function toMinutes(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/**
 * Detect overlap clusters and assign columns within each cluster.
 * Returns appointments with leftPct / widthPct relative to the column area.
 */
function layoutAppts(appts: Appointment[], doctors: Map<string, TimelineDoctor>): PositionedAppt[] {
  if (!appts.length) return [];

  const sorted = [...appts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  // Assign column index
  const colEnd: number[] = []; // tracks end minute for each column slot
  const colMap = new Map<string, number>(); // apptId → column

  for (const appt of sorted) {
    const startMin = toMinutes(appt.scheduledAt);
    const endMin = startMin + appt.durationMins;
    let col = colEnd.findIndex((end) => end <= startMin);
    if (col === -1) col = colEnd.length;
    colEnd[col] = endMin;
    colMap.set(appt.id, col);
  }

  // Second pass: compute max concurrent columns at each appointment
  const result: PositionedAppt[] = sorted.map((appt) => {
    const startMin = toMinutes(appt.scheduledAt);
    const endMin = startMin + appt.durationMins;
    const col = colMap.get(appt.id) ?? 0;

    // How many columns overlap with this appointment's time range?
    let maxCols = 1;
    for (const other of sorted) {
      if (other.id === appt.id) continue;
      const oStart = toMinutes(other.scheduledAt);
      const oEnd = oStart + other.durationMins;
      if (oStart < endMin && oEnd > startMin) {
        maxCols = Math.max(maxCols, (colMap.get(other.id) ?? 0) + 1, col + 1);
      }
    }

    const top = Math.max(0, (startMin - START_HOUR * 60)) * PX_PER_MIN;
    const height = Math.max(30, appt.durationMins * PX_PER_MIN);

    return {
      appt,
      doctor: doctors.get(appt.doctorId),
      top,
      height,
      leftPct: (col / maxCols) * 100,
      widthPct: (1 / maxCols) * 100,
    };
  });

  return result;
}

function hourLabel(h: number): string {
  if (h === 0 || h === 12) return `12 ${h === 0 ? 'AM' : 'PM'}`;
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export function DoctorTimeline({ appointments, doctors, isLoading, onSelectSlot, onEventClick }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [activeDoctorId, setActiveDoctorId] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow(30_000);
  const isToday = isSameDay(selectedDate, now);

  /* Build doctor colour map */
  const doctorMap = useMemo<Map<string, TimelineDoctor>>(() => {
    const map = new Map<string, TimelineDoctor>();
    let i = 0;
    doctors?.forEach((d) => {
      map.set(d.id, { id: d.id, name: d.name, color: DOCTOR_COLORS[i++ % DOCTOR_COLORS.length] });
    });
    appointments?.forEach((a) => {
      if (a.doctor && !map.has(a.doctorId)) {
        map.set(a.doctorId, {
          id: a.doctorId,
          name: a.doctor.name ?? 'Doctor',
          color: DOCTOR_COLORS[map.size % DOCTOR_COLORS.length],
        });
      }
    });
    return map;
  }, [doctors, appointments]);

  const allDoctors = useMemo(() => Array.from(doctorMap.values()), [doctorMap]);

  /* Day appointments */
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

  /* Filter by active doctor */
  const visibleAppts = useMemo(() =>
    activeDoctorId === 'all' ? dayAppts : dayAppts.filter((a) => a.doctorId === activeDoctorId),
    [dayAppts, activeDoctorId],
  );

  /* Layout */
  const positioned = useMemo(() => layoutAppts(visibleAppts, doctorMap), [visibleAppts, doctorMap]);

  /* Now indicator */
  const nowTop = useMemo(() => {
    if (!isToday) return null;
    const h = now.getHours(), m = now.getMinutes();
    if (h < START_HOUR || h >= END_HOUR) return null;
    return ((h - START_HOUR) * 60 + m) * PX_PER_MIN;
  }, [isToday, now]);

  /* Navigation */
  const shiftDate = useCallback((delta: number) => {
    setSelectedDate((prev) => {
      const n = new Date(prev); n.setDate(n.getDate() + delta); return n;
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); setSelectedDate(d);
  }, []);

  const dateLabel = useMemo(() =>
    selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
    [selectedDate],
  );

  /* Click on time grid to book */
  const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-appt]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top + e.currentTarget.scrollTop;
    const totalMin = START_HOUR * 60 + Math.max(0, Math.min(Math.floor(offsetY / PX_PER_MIN), TOTAL_MINS - 1));
    const slot = new Date(selectedDate);
    slot.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
    onSelectSlot(slot, activeDoctorId === 'all' ? undefined : activeDoctorId);
  }, [selectedDate, activeDoctorId, onSelectSlot]);

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
    <div className="card-aura flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">

      {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 border-b bg-muted/20 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">

          {/* Date navigation */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={goToday} disabled={isToday}
              className="h-8 px-2.5 text-xs font-semibold active:scale-95">
              <CalendarDays className="size-3.5" />
              <span className="hidden sm:inline ml-1">Today</span>
            </Button>
            <div className="flex items-center overflow-hidden rounded-lg border bg-background/60">
              <button type="button" onClick={() => shiftDate(-1)} aria-label="Previous day"
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95 cursor-pointer">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => shiftDate(1)} aria-label="Next day"
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95 cursor-pointer">
                <ChevronRight className="size-4" />
              </button>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground">{dateLabel}</span>
          </div>

          {/* Stats — compact, no badge */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Users className="size-3.5 text-primary" />
              {allDoctors.length} dr{allDoctors.length !== 1 ? 's' : ''}
            </span>
            <span className="h-3 w-px bg-border" />
            <span>{dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Doctor filter pills */}
        {allDoctors.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button type="button" onClick={() => setActiveDoctorId('all')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95',
                activeDoctorId === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}>
              All doctors
            </button>
            {allDoctors.map((doc) => (
              <button key={doc.id} type="button" onClick={() => setActiveDoctorId(doc.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95',
                  activeDoctorId === doc.id
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}>
                {/* Colour dot instead of avatar */}
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: doc.color }}
                />
                {/* Full name on sm+, first name on mobile */}
                <span className="hidden sm:inline">{doc.name}</span>
                <span className="sm:hidden">{doc.name.split(' ')[0]}</span>
                <span className="rounded-full bg-background/25 px-1 text-[10px] font-bold">
                  {dayAppts.filter((a) => a.doctorId === doc.id).length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Time Grid ─────────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onClick={handleGridClick}
        className="relative overflow-y-auto overscroll-contain cursor-pointer"
        style={{ maxHeight: 'calc(100vh - 16rem)', minHeight: '360px' }}
      >
        <div className="relative flex" style={{ height: `${TOTAL_HEIGHT}px` }}>

          {/* Time axis (sticky left) */}
          <div className="sticky left-0 z-10 w-12 shrink-0 border-r bg-card/95 backdrop-blur-md">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-0 flex w-12 items-start justify-end pr-1.5 text-[10px] font-semibold text-muted-foreground/60"
                style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span className="mt-0.5">{hourLabel(h)}</span>
              </div>
            ))}
          </div>

          {/* Appointment area */}
          <div className="relative flex-1">
            {/* Hour grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/30"
                style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
              />
            ))}
            {/* Half-hour dashed lines */}
            {HOURS.map((h) => (
              <div
                key={`${h}h`}
                className="absolute left-0 right-0 border-t border-border/15 border-dashed"
                style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
              />
            ))}

            {/* Now indicator */}
            {nowTop !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${nowTop}px` }}
              >
                <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] -ml-1 animate-pulse" />
                <div className="h-0.5 flex-1 bg-rose-500/70" />
              </div>
            )}

            {/* Hover hint overlay when no appointments */}
            {positioned.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  <Plus className="size-3.5" />
                  Click anywhere to book
                </span>
              </div>
            )}

            {/* Appointment cards */}
            {positioned.map(({ appt, doctor, top, height, leftPct, widthPct }) => {
              const accent = STATUS_COLORS[appt.status];
              const docColor = doctor?.color ?? accent;
              const isCancelled = appt.status === 'cancelled';
              const isTiny = height < 32;
              const isShort = height < 56;

              return (
                <div
                  key={appt.id}
                  data-appt
                  onClick={(e) => { e.stopPropagation(); onEventClick(appt); }}
                  className={cn(
                    'card-aura absolute z-10 flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs',
                    'cursor-pointer transition-all duration-150',
                    'hover:z-20 hover:shadow-lg hover:ring-2 hover:ring-primary/30 hover:-translate-y-0.5',
                    'active:scale-[0.985]',
                    isCancelled && 'opacity-50',
                  )}
                  style={{
                    top: `${top + 2}px`,
                    height: `${height - 4}px`,
                    left: `calc(${leftPct}% + 2px)`,
                    width: `calc(${widthPct}% - 4px)`,
                    borderLeftWidth: '3px',
                    borderLeftColor: accent,
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: accent }} />

                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-1.5 py-1">
                    {/* Patient name */}
                    <p className={cn(
                      'truncate font-bold leading-tight text-foreground transition-colors group-hover:text-primary',
                      isTiny ? 'text-[9px]' : 'text-[10px] sm:text-xs',
                      isCancelled && 'line-through',
                    )}>
                      {patientDisplayName(appt)}
                    </p>

                    {/* Time + duration */}
                    {!isTiny && (
                      <p className="truncate text-[9px] text-muted-foreground font-medium">
                        {formatApptStartAmPm(appt)} · {appt.durationMins}m
                      </p>
                    )}

                    {/* Doctor name with colour dot */}
                    {!isShort && (
                      <p className="flex items-center gap-1 truncate text-[9px] font-semibold" style={{ color: docColor }}>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: docColor }} />
                        {doctor?.name ?? appt.doctor?.name}
                      </p>
                    )}

                    {/* Service / room / session — only if space */}
                    {!isShort && (
                      <div className="hidden sm:flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                        {appt.service && (
                          <span className="flex items-center gap-0.5 truncate font-medium text-foreground/80">
                            <Stethoscope className="size-2 text-primary shrink-0" />
                            {appt.service.name}
                          </span>
                        )}
                        {appt.sessionType === 'online' ? (
                          <span className="flex items-center gap-0.5 text-primary font-medium">
                            <Video className="size-2.5" /> Online
                          </span>
                        ) : appt.room ? (
                          <span className="flex items-center gap-0.5 font-medium">
                            <DoorOpen className="size-2.5" /> {appt.room.name}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Status select — only if tall enough */}
                  {!isTiny && (
                    <div
                      className="absolute bottom-1 right-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AppointmentStatusSelect appointment={appt} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
