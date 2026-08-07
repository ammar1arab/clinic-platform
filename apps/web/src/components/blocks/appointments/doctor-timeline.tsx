'use client';

import { useMemo, useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Plus,
  Stethoscope,
  User,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/services/appointments.service';
import { ClinicStaffMember } from '@/services/clinics.service';
import { STATUS_COLORS } from './status-colors';
import { AppointmentStatusSelect } from './appointment-status-select';
import { patientDisplayName, formatApptTimeRange } from './calendar-time';
import { cn } from '@/lib/utils';
import { TimelineSkeleton } from '@/components/primitives/skeleton-presets';
import { useNow } from '@/hooks/use-now';

interface Props {
  appointments: Appointment[] | undefined;
  doctors: ClinicStaffMember[] | undefined;
  isLoading: boolean;
  onSelectSlot: (date: Date, doctorId?: string) => void;
  onEventClick: (appointment: Appointment) => void;
}

interface TimelineDoctor {
  id: string;
  name: string;
  role: string;
  initials: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export function DoctorTimeline({
  appointments,
  doctors,
  isLoading,
  onSelectSlot,
  onEventClick,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = useNow(30_000);

  const activeDoctors = useMemo<TimelineDoctor[]>(() => {
    const map = new Map<string, TimelineDoctor>();

    if (doctors && doctors.length > 0) {
      for (const doc of doctors) {
        const initials = doc.initials || doc.name.substring(0, 2).toUpperCase();
        map.set(doc.id, {
          id: doc.id,
          name: doc.name,
          role: doc.role || 'Doctor',
          initials,
        });
      }
    }

    if (appointments && appointments.length > 0) {
      for (const appt of appointments) {
        if (appt.doctor && !map.has(appt.doctorId)) {
          const docName = appt.doctor.name || 'Doctor';
          map.set(appt.doctorId, {
            id: appt.doctorId,
            name: docName,
            role: 'Doctor',
            initials: docName.substring(0, 2).toUpperCase(),
          });
        }
      }
    }

    return Array.from(map.values());
  }, [doctors, appointments]);

  const displayedDoctors = useMemo(() => {
    if (selectedDoctorId === 'all') return activeDoctors;
    const found = activeDoctors.find((d) => d.id === selectedDoctorId);
    return found ? [found] : activeDoctors;
  }, [activeDoctors, selectedDoctorId]);

  const dateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const isToday = useMemo(() => {
    return (
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear()
    );
  }, [selectedDate, now]);

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() - 1);
      return n;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() + 1);
      return n;
    });
  };

  const handleToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  };

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
        const list = map.get(appt.doctorId) ?? [];
        list.push(appt);
        map.set(appt.doctorId, list);
      }
    }

    return map;
  }, [appointments, dayStart, dayEnd]);

  const nowTopPercent = useMemo(() => {
    if (!isToday) return null;
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < 7 || h >= 21) return null;
    const totalMinutes = (h - 7) * 60 + m;
    const timelineTotal = 14 * 60;
    return (totalMinutes / timelineTotal) * 100;
  }, [isToday, now]);

  if (isLoading) {
    return <TimelineSkeleton columns={Math.max(2, activeDoctors.length || 3)} />;
  }

  if (activeDoctors.length === 0) {
    return (
      <div className="card-aura flex flex-col items-center justify-center rounded-2xl border bg-card p-8 sm:p-12 text-center shadow-xs">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted/80 text-muted-foreground shadow-2xs">
          <Users className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">No Doctors Available</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          There are no doctors or scheduled visits for this clinic today.
        </p>
        <Button
          size="sm"
          className="mt-4"
          onClick={() => {
            const slot = new Date(selectedDate);
            slot.setHours(9, 0, 0, 0);
            onSelectSlot(slot);
          }}
        >
          <Plus className="mr-1.5 size-3.5" /> Book Appointment
        </Button>
      </div>
    );
  }

  // Responsive column width: on mobile single doctor gets full width, on desktop min 200px
  const colCount = displayedDoctors.length;
  const colWidth = colCount === 1 ? '1fr' : 'minmax(160px, 1fr)';
  const minGridWidth = colCount === 1 ? '100%' : `${52 + colCount * 180}px`;

  return (
    <div className="card-aura relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col gap-2.5 border-b bg-muted/20 p-3 sm:p-4">
        {/* Row 1: Date nav + Today badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Today button — hidden on very small screens, shows on sm+ */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              disabled={isToday}
              className="hidden sm:flex h-8 transition-all duration-150 active:scale-95 font-semibold text-xs"
            >
              Today
            </Button>

            {/* Compact Today on mobile */}
            <button
              type="button"
              onClick={handleToday}
              disabled={isToday}
              className={cn(
                'sm:hidden grid size-8 place-items-center rounded-lg border text-xs font-bold transition-all active:scale-95',
                isToday
                  ? 'opacity-40 cursor-not-allowed border-border'
                  : 'border-border hover:bg-muted cursor-pointer',
              )}
            >
              ★
            </button>

            <div className="flex items-center gap-0 rounded-lg border bg-background/80 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handlePrevDay}
                aria-label="Previous day"
                className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                aria-label="Next day"
                className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
              {dateLabel}
            </span>

            {isToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="hidden sm:inline">Live</span>
              </span>
            )}
          </div>

          {/* Right: doctor count + click hint */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1 font-medium text-foreground">
              <User className="size-3.5 text-primary" />
              {activeDoctors.length} Doctor{activeDoctors.length === 1 ? '' : 's'}
            </span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              Tap a slot to book
            </span>
          </div>
        </div>

        {/* Row 2: Doctor filter pills */}
        {activeDoctors.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDoctorId('all')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95',
                selectedDoctorId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Users className="size-3" />
              <span className="hidden sm:inline">All Doctors</span>
              <span className="sm:hidden">All</span>
              <span>({activeDoctors.length})</span>
            </button>
            {activeDoctors.map((doc) => {
              const active = selectedDoctorId === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-background/30 text-[9px]">
                    {doc.initials}
                  </span>
                  {/* Show full name on sm+ only */}
                  <span className="hidden sm:inline">{doc.name}</span>
                  {/* Show initials only on mobile when there are many */}
                  <span className="sm:hidden">{doc.initials}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline Grid */}
      <div ref={scrollRef} className="relative overflow-auto overscroll-contain" style={{ maxHeight: '75vh', minHeight: '320px' }}>
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `52px repeat(${colCount}, ${colWidth})`,
            minWidth: minGridWidth,
          }}
        >
          {/* Now indicator */}
          {nowTopPercent !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${nowTopPercent}%` }}
            >
              <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] -ml-1 animate-pulse" />
              <div className="h-0.5 w-full bg-rose-500/80 shadow-[0_0_4px_rgba(244,63,94,0.5)]" />
            </div>
          )}

          {/* Corner cell */}
          <div className="sticky top-0 left-0 z-30 flex items-center justify-center border-r border-b bg-card/95 p-1.5 backdrop-blur-md shadow-xs">
            <Clock className="size-3.5 text-primary" />
          </div>

          {/* Doctor header columns */}
          {displayedDoctors.map((doc) => {
            const docAppts = apptsByDoctor.get(doc.id) ?? [];
            const activeCount = docAppts.filter((a) => a.status !== 'cancelled').length;

            return (
              <div
                key={doc.id}
                className="sticky top-0 z-20 flex items-center justify-between border-r border-b bg-card/95 p-2 sm:p-3 backdrop-blur-md shadow-xs transition-colors"
              >
                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <div className="grid size-7 sm:size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/20">
                    {doc.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] sm:text-xs font-bold text-foreground hover:text-primary transition-colors">
                      {/* On mobile: only initials or truncated first name */}
                      <span className="hidden sm:inline">{doc.name}</span>
                      <span className="sm:hidden">{doc.name.split(' ')[0]}</span>
                    </p>
                    <p className="truncate text-[9px] sm:text-[10px] font-medium text-muted-foreground capitalize hidden sm:block">
                      {doc.role}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="hidden sm:inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {activeCount}
                  </span>
                  <button
                    type="button"
                    title={`Book with ${doc.name}`}
                    onClick={() => {
                      const slot = new Date(selectedDate);
                      slot.setHours(9, 0, 0, 0);
                      onSelectSlot(slot, doc.id);
                    }}
                    className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Hour rows */}
          {HOURS.map((hour) => {
            const hourLabel = `${hour % 12 === 0 ? 12 : hour % 12}${hour >= 12 ? 'p' : 'a'}`;
            const hourLabelFull = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

            return (
              <div key={hour} className="contents">
                {/* Time label cell */}
                <div className="sticky left-0 z-10 flex h-24 sm:h-28 items-start justify-end border-r border-b bg-card/95 px-1 pt-1.5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground backdrop-blur-md">
                  {/* Compact on mobile, full on desktop */}
                  <span className="sm:hidden">{hourLabel}</span>
                  <span className="hidden sm:inline">{hourLabelFull}</span>
                </div>

                {/* Doctor columns for this hour */}
                {displayedDoctors.map((doc) => {
                  const docAppts = apptsByDoctor.get(doc.id) ?? [];
                  const hourAppts = docAppts.filter((appt) => {
                    const d = new Date(appt.scheduledAt);
                    return d.getHours() === hour;
                  });

                  return (
                    <div
                      key={`${doc.id}-${hour}`}
                      onClick={() => {
                        const slot = new Date(selectedDate);
                        slot.setHours(hour, 0, 0, 0);
                        onSelectSlot(slot, doc.id);
                      }}
                      className="group relative flex h-24 sm:h-28 flex-col gap-1 sm:gap-1.5 border-r border-b bg-background/30 p-1 sm:p-1.5 transition-all duration-150 hover:bg-primary/5 cursor-pointer"
                    >
                      {/* Hover hint — only on sm+ */}
                      <div className="absolute inset-0 z-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary shadow-xs ring-1 ring-primary/20 transition-transform group-hover:scale-105">
                          <Plus className="size-3" /> {hourLabelFull}
                        </span>
                      </div>

                      {/* Appointment cards */}
                      {hourAppts.map((appt) => {
                        const accent = STATUS_COLORS[appt.status];
                        const isCancelled = appt.status === 'cancelled';

                        return (
                          <div
                            key={appt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(appt);
                            }}
                            className={cn(
                              'card-aura relative z-10 flex flex-col rounded-lg sm:rounded-xl border bg-card p-1.5 sm:p-2.5 text-left shadow-xs transition-all duration-200 cursor-pointer',
                              'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 hover:ring-1 hover:ring-primary/20 active:scale-[0.985]',
                              isCancelled && 'opacity-60 bg-muted/40',
                            )}
                            style={{
                              borderLeftWidth: '3px',
                              borderLeftColor: accent,
                            }}
                          >
                            {/* Patient name */}
                            <p className={cn(
                              'truncate text-[10px] sm:text-xs font-bold text-foreground transition-colors',
                              isCancelled && 'line-through',
                            )}>
                              {patientDisplayName(appt)}
                            </p>

                            {/* Time — hidden on mobile if space is tight */}
                            <p className="mt-0.5 truncate text-[9px] sm:text-[10px] text-muted-foreground font-medium hidden sm:flex items-center gap-0.5">
                              <Clock className="size-2.5 shrink-0" />
                              {formatApptTimeRange(appt)}
                            </p>

                            {/* Bottom row: service/room + status select */}
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                                {appt.service && (
                                  <span className="hidden sm:inline-flex items-center gap-0.5 truncate font-medium text-foreground/80">
                                    <Stethoscope className="size-2 text-primary shrink-0" />
                                    {appt.service.name}
                                  </span>
                                )}
                                {appt.sessionType === 'online' ? (
                                  <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                                    <Video className="size-2.5" />
                                    <span className="hidden sm:inline">Online</span>
                                  </span>
                                ) : (
                                  appt.room && (
                                    <span className="hidden sm:inline-flex items-center gap-0.5 font-medium text-muted-foreground">
                                      <DoorOpen className="size-2.5" />
                                      {appt.room.name}
                                    </span>
                                  )
                                )}
                              </div>
                              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                <AppointmentStatusSelect appointment={appt} compact />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
