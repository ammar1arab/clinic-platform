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

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const START_HOUR = 7;     // 7 AM
const END_HOUR = 21;      // 9 PM
const TOTAL_MINS = (END_HOUR - START_HOUR) * 60;
const PX_PER_MIN = 2;     // 2px per minute → 1680px total height
const TOTAL_HEIGHT = TOTAL_MINS * PX_PER_MIN;
const HOUR_HEIGHT = 60 * PX_PER_MIN;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface TimelineDoctor {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

interface PositionedAppt {
  appt: Appointment;
  top: number;
  height: number;
  left: string;
  width: string;
  column: number;
  totalColumns: number;
}

interface Props {
  appointments: Appointment[] | undefined;
  doctors: ClinicStaffMember[] | undefined;
  isLoading: boolean;
  onSelectSlot: (date: Date, doctorId?: string) => void;
  onEventClick: (appointment: Appointment) => void;
}

/* ─── Colour palette for doctor avatars ─────────────────────────────────────── */
const DOC_COLORS = [
  'bg-primary/15 text-primary ring-primary/30',
  'bg-violet-500/15 text-violet-600 ring-violet-500/30',
  'bg-emerald-500/15 text-emerald-600 ring-emerald-500/30',
  'bg-amber-500/15 text-amber-600 ring-amber-500/30',
  'bg-rose-500/15 text-rose-600 ring-rose-500/30',
  'bg-cyan-500/15 text-cyan-600 ring-cyan-500/30',
  'bg-orange-500/15 text-orange-600 ring-orange-500/30',
  'bg-pink-500/15 text-pink-600 ring-pink-500/30',
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function minutesFromDayStart(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes() - START_HOUR * 60;
}

function apptTop(appt: Appointment): number {
  return Math.max(0, minutesFromDayStart(appt.scheduledAt) * PX_PER_MIN);
}

function apptHeight(appt: Appointment): number {
  return Math.max(PX_PER_MIN * 15, appt.durationMins * PX_PER_MIN);
}

/**
 * Resolve overlapping appointments into columns (like Google Calendar).
 * Returns PositionedAppt[] with left/width based on column index.
 */
function layoutAppts(appts: Appointment[]): PositionedAppt[] {
  if (!appts.length) return [];

  const sorted = [...appts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  // Group overlapping clusters
  const result: PositionedAppt[] = [];
  const columns: { endMin: number; id: string }[][] = [];

  for (const appt of sorted) {
    const startMin = minutesFromDayStart(appt.scheduledAt);
    const endMin = startMin + appt.durationMins;

    // Find a free column
    let col = -1;
    for (let i = 0; i < columns.length; i++) {
      const lastInCol = columns[i][columns[i].length - 1];
      if (lastInCol.endMin <= startMin) {
        col = i;
        break;
      }
    }
    if (col === -1) {
      col = columns.length;
      columns.push([]);
    }
    columns[col].push({ endMin, id: appt.id });

    result.push({
      appt,
      top: apptTop(appt),
      height: apptHeight(appt),
      left: '0%',
      width: '100%',
      column: col,
      totalColumns: 1,
    });
  }

  // Second pass: determine how many columns are active at each event's time
  for (const item of result) {
    const startMin = minutesFromDayStart(item.appt.scheduledAt);
    const endMin = startMin + item.appt.durationMins;

    let maxCols = 1;
    for (let c = 0; c < columns.length; c++) {
      for (const { endMin: cEnd, id } of columns[c]) {
        if (id === item.appt.id) continue;
        const otherStart = result.find((r) => r.appt.id === id);
        if (!otherStart) continue;
        const otherStartMin = minutesFromDayStart(otherStart.appt.scheduledAt);
        if (otherStartMin < endMin && cEnd > startMin) {
          maxCols = Math.max(maxCols, item.column + 1, c + 1);
        }
      }
    }

    item.totalColumns = maxCols;
    item.left = `${(item.column / maxCols) * 100}%`;
    item.width = `${(1 / maxCols) * 100}%`;
  }

  return result;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function clickMinute(e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>): number {
  if (!containerRef.current) return 0;
  const rect = containerRef.current.getBoundingClientRect();
  const y = e.clientY - rect.top + containerRef.current.scrollTop;
  return Math.floor(y / PX_PER_MIN);
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export function DoctorTimeline({ appointments, doctors, isLoading, onSelectSlot, onEventClick }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [activeDoctorId, setActiveDoctorId] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow(30_000);

  /* Build doctor list */
  const allDoctors = useMemo<TimelineDoctor[]>(() => {
    const map = new Map<string, TimelineDoctor>();
    doctors?.forEach((doc, i) => {
      map.set(doc.id, {
        id: doc.id,
        name: doc.name,
        role: doc.role ?? 'Doctor',
        initials: doc.initials ?? doc.name.substring(0, 2).toUpperCase(),
        color: DOC_COLORS[i % DOC_COLORS.length],
      });
    });
    appointments?.forEach((appt, i) => {
      if (appt.doctor && !map.has(appt.doctorId)) {
        const name = appt.doctor.name ?? 'Doctor';
        map.set(appt.doctorId, {
          id: appt.doctorId,
          name,
          role: 'Doctor',
          initials: name.substring(0, 2).toUpperCase(),
          color: DOC_COLORS[map.size % DOC_COLORS.length],
        });
      }
    });
    return Array.from(map.values());
  }, [doctors, appointments]);

  const displayedDoctors = useMemo(() => {
    if (activeDoctorId === 'all') return allDoctors;
    return allDoctors.filter((d) => d.id === activeDoctorId);
  }, [allDoctors, activeDoctorId]);

  /* Day appointments bucketed per doctor */
  const isToday = isSameDay(selectedDate, now);
  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);
  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [selectedDate]);

  const apptsByDoctor = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (!appointments) return map;
    for (const appt of appointments) {
      const t = new Date(appt.scheduledAt).getTime();
      if (t >= dayStart && t <= dayEnd) {
        const prev = map.get(appt.doctorId) ?? [];
        prev.push(appt);
        map.set(appt.doctorId, prev);
      }
    }
    return map;
  }, [appointments, dayStart, dayEnd]);

  /* Now indicator position */
  const nowTop = useMemo(() => {
    if (!isToday) return null;
    const h = now.getHours(), m = now.getMinutes();
    if (h < START_HOUR || h >= END_HOUR) return null;
    return ((h - START_HOUR) * 60 + m) * PX_PER_MIN;
  }, [isToday, now]);

  /* Date navigation */
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

  const dateLabel = useMemo(() =>
    selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    [selectedDate]);

  const handleColumnClick = useCallback((e: React.MouseEvent, doctorId: string) => {
    // Don't fire when clicking an appointment card
    if ((e.target as HTMLElement).closest('[data-appt-card]')) return;
    const mins = clickMinute(e, scrollRef);
    const totalMin = START_HOUR * 60 + Math.max(0, Math.min(mins, TOTAL_MINS - 1));
    const slot = new Date(selectedDate);
    slot.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
    onSelectSlot(slot, doctorId);
  }, [selectedDate, onSelectSlot]);

  if (isLoading) return <TimelineSkeleton columns={Math.max(2, allDoctors.length || 3)} />;

  if (allDoctors.length === 0) {
    return (
      <div className="card-aura flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center shadow-xs">
        <div className="grid size-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
          <Users className="size-7" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-foreground">No doctors found</h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Add staff members or book the first appointment to see the timeline.
        </p>
        <Button size="sm" className="mt-5" onClick={() => { const s = new Date(selectedDate); s.setHours(9, 0, 0, 0); onSelectSlot(s); }}>
          <Plus className="mr-1.5 size-3.5" /> Book Appointment
        </Button>
      </div>
    );
  }

  /* ─── Layout computations ─────────────────────────────────────────────────── */
  const totalAppts = [...apptsByDoctor.values()].flat().length;

  return (
    <div className="card-aura flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b bg-muted/20 px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Row 1 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Date nav */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline" size="sm"
              onClick={goToday} disabled={isToday}
              className="h-8 px-3 text-xs font-semibold active:scale-95"
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden sm:inline ml-1.5">Today</span>
            </Button>
            <div className="flex items-center rounded-lg border bg-background/60 shadow-2xs overflow-hidden">
              <button type="button" onClick={() => shiftDate(-1)} aria-label="Previous day"
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 cursor-pointer">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => shiftDate(1)} aria-label="Next day"
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 cursor-pointer">
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-foreground">{dateLabel}</span>
              {isToday && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1 font-medium">
              <Users className="size-3.5 text-primary" />
              {displayedDoctors.length} doctor{displayedDoctors.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-foreground/70 border border-border/40">
              {totalAppts} visit{totalAppts !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Row 2: Doctor filter pills */}
        {allDoctors.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button type="button" onClick={() => setActiveDoctorId('all')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                activeDoctorId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}>
              <Users className="size-3" />
              All ({allDoctors.length})
            </button>
            {allDoctors.map((doc) => (
              <button key={doc.id} type="button" onClick={() => setActiveDoctorId(doc.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                  activeDoctorId === doc.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}>
                <span className={cn('grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ring-1', doc.color)}>
                  {doc.initials}
                </span>
                <span className="hidden sm:inline">{doc.name}</span>
                <span className="sm:hidden">{doc.name.split(' ')[0]}</span>
                <span className="rounded-full bg-background/30 px-1 text-[9px] font-bold">
                  {apptsByDoctor.get(doc.id)?.length ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Timeline ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col overflow-hidden">
        {/* Doctor header row (sticky) */}
        <div
          className="sticky top-0 z-30 grid border-b bg-card/95 backdrop-blur-md shadow-xs"
          style={{ gridTemplateColumns: `52px repeat(${displayedDoctors.length}, minmax(0, 1fr))` }}
        >
          {/* Corner */}
          <div className="flex items-center justify-center border-r p-2">
            <Clock className="size-3.5 text-primary" />
          </div>
          {displayedDoctors.map((doc) => {
            const count = apptsByDoctor.get(doc.id)?.length ?? 0;
            return (
              <div key={doc.id} className="flex items-center justify-between border-r px-2.5 py-2 sm:px-3 last:border-r-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('grid size-7 sm:size-8 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-xs ring-1', doc.color)}>
                    {doc.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] sm:text-xs font-bold text-foreground">
                      <span className="sm:hidden">{doc.name.split(' ')[0]}</span>
                      <span className="hidden sm:inline">{doc.name}</span>
                    </p>
                    <p className="hidden sm:block truncate text-[10px] text-muted-foreground capitalize">{doc.role}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="hidden sm:inline rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {count} visit{count !== 1 ? 's' : ''}
                  </span>
                  <button type="button" title={`Book with ${doc.name}`}
                    onClick={() => { const s = new Date(selectedDate); s.setHours(9, 0, 0, 0); onSelectSlot(s, doc.id); }}
                    className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer active:scale-95">
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div
          ref={scrollRef}
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(100vh - 18rem)', minHeight: '400px' }}
        >
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `52px repeat(${displayedDoctors.length}, minmax(0, 1fr))`,
              height: `${TOTAL_HEIGHT}px`,
            }}
          >
            {/* Hour guide lines — rendered once, span all columns */}
            <div className="absolute inset-0 pointer-events-none" style={{ left: '52px' }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/30"
                  style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
                />
              ))}
              {/* Half-hour guides */}
              {HOURS.map((h) => (
                <div
                  key={`${h}-30`}
                  className="absolute left-0 right-0 border-t border-border/15 border-dashed"
                  style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                />
              ))}
            </div>

            {/* Now indicator */}
            {nowTop !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${nowTop}px` }}
              >
                <div className="w-[52px] flex justify-end pr-1">
                  <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] animate-pulse" />
                </div>
                <div className="flex-1 h-0.5 bg-rose-500/80 shadow-[0_0_4px_rgba(244,63,94,0.4)]" />
              </div>
            )}

            {/* Time label column */}
            <div className="relative border-r">
              {HOURS.map((h) => {
                const label = h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
                return (
                  <div
                    key={h}
                    className="absolute right-0 flex w-full items-start justify-end pr-1.5 text-[10px] font-semibold text-muted-foreground/70"
                    style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="mt-0.5">{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Doctor columns */}
            {displayedDoctors.map((doc) => {
              const docAppts = apptsByDoctor.get(doc.id) ?? [];
              const positioned = layoutAppts(docAppts);

              return (
                <div
                  key={doc.id}
                  onClick={(e) => handleColumnClick(e, doc.id)}
                  className="relative border-r last:border-r-0 cursor-pointer hover:bg-primary/[0.02] transition-colors"
                  style={{ height: `${TOTAL_HEIGHT}px` }}
                  title="Click to book at this time"
                >
                  {/* Appointment cards */}
                  {positioned.map(({ appt, top, height, left, width }) => {
                    const accent = STATUS_COLORS[appt.status];
                    const isCancelled = appt.status === 'cancelled';
                    const isShort = height < 48;
                    const isTiny = height < 30;

                    return (
                      <div
                        key={appt.id}
                        data-appt-card
                        onClick={(e) => { e.stopPropagation(); onEventClick(appt); }}
                        className={cn(
                          'absolute card-aura group flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs',
                          'transition-all duration-150 cursor-pointer z-10',
                          'hover:z-20 hover:shadow-md hover:ring-1 hover:ring-primary/30 hover:-translate-y-0.5',
                          'active:scale-[0.985]',
                          isCancelled && 'opacity-50',
                        )}
                        style={{
                          top: `${top + 2}px`,
                          height: `${Math.max(height - 4, 20)}px`,
                          left: `calc(${left} + 2px)`,
                          width: `calc(${width} - 4px)`,
                          borderLeftWidth: '3px',
                          borderLeftColor: accent,
                        }}
                      >
                        {/* Colour top bar */}
                        <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: accent }} />

                        <div className="flex min-h-0 flex-1 flex-col gap-0.5 px-1.5 py-1 overflow-hidden">
                          {/* Patient name — always visible */}
                          <p className={cn(
                            'truncate font-bold leading-tight transition-colors',
                            isTiny ? 'text-[9px]' : 'text-[10px] sm:text-xs',
                            'text-foreground group-hover:text-primary',
                            isCancelled && 'line-through',
                          )}>
                            {patientDisplayName(appt)}
                          </p>

                          {/* Time — hide if very short */}
                          {!isTiny && (
                            <p className="truncate text-[9px] font-medium text-muted-foreground flex items-center gap-0.5">
                              <span>{formatApptStartAmPm(appt)}</span>
                              <span className="opacity-50">·</span>
                              <span>{appt.durationMins}m</span>
                            </p>
                          )}

                          {/* Service / room / session type — only if tall enough */}
                          {!isShort && (
                            <div className="flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                              {appt.service && (
                                <span className="hidden sm:inline-flex items-center gap-0.5 font-medium text-foreground/80 truncate">
                                  <Stethoscope className="size-2 text-primary shrink-0" />
                                  {appt.service.name}
                                </span>
                              )}
                              {appt.sessionType === 'online' ? (
                                <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                                  <Video className="size-2.5" /> Online
                                </span>
                              ) : appt.room ? (
                                <span className="hidden sm:inline-flex items-center gap-0.5 text-muted-foreground font-medium">
                                  <DoorOpen className="size-2.5" /> {appt.room.name}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Status select — pinned to bottom right, only if tall enough */}
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

                  {/* Empty column hint */}
                  {positioned.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                        <Plus className="size-3" /> Click to book
                      </span>
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
