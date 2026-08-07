'use client';

import { useMemo, useState } from 'react';
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
      <div className="card-aura flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center shadow-xs">
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

  return (
    <div className="card-aura relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-all duration-200">
      <div className="flex flex-col gap-3 border-b bg-muted/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              disabled={isToday}
              className="h-8 transition-all duration-150 active:scale-95 font-semibold text-xs"
            >
              Today
            </Button>
            <div className="flex items-center gap-0.5 rounded-lg border bg-background/80 p-0.5 shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 transition-all active:scale-95"
                onClick={handlePrevDay}
                aria-label="Previous day"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 transition-all active:scale-95"
                onClick={handleNextDay}
                aria-label="Next day"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground">{dateLabel}</span>
            {isToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Today
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1 font-medium text-foreground">
              <User className="size-3.5 text-primary" />
              {activeDoctors.length} Doctor{activeDoctors.length === 1 ? '' : 's'}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="text-[11px] text-muted-foreground font-medium">Click slot to book</span>
          </div>
        </div>

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
              All Doctors ({activeDoctors.length})
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
                  <span className="grid size-4 place-items-center rounded-full bg-background/30 text-[9px]">
                    {doc.initials}
                  </span>
                  {doc.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative max-h-[75vh] min-h-125 overflow-auto">
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `64px repeat(${displayedDoctors.length}, minmax(${displayedDoctors.length === 1 ? '100%' : '240px'}, 1fr))`,
            minWidth: displayedDoctors.length === 1 ? '100%' : `${64 + displayedDoctors.length * 240}px`,
          }}
        >
          {nowTopPercent !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${nowTopPercent}%` }}
            >
              <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] -ml-1 animate-pulse" />
              <div className="h-0.5 w-full bg-rose-500/80 shadow-[0_0_4px_rgba(244,63,94,0.5)]" />
            </div>
          )}

          <div className="sticky top-0 left-0 z-30 flex items-center justify-center border-r border-b bg-card/95 p-2 text-xs font-bold text-muted-foreground backdrop-blur-md shadow-xs">
            <Clock className="size-3.5 text-primary" />
          </div>

          {displayedDoctors.map((doc) => {
            const docAppts = apptsByDoctor.get(doc.id) ?? [];
            const activeCount = docAppts.filter((a) => a.status !== 'cancelled').length;

            return (
              <div
                key={doc.id}
                className="sticky top-0 z-20 flex items-center justify-between border-r border-b bg-card/95 p-3 backdrop-blur-md shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/20">
                    {doc.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="truncate text-[10px] font-medium text-muted-foreground capitalize">
                      {doc.role}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {activeCount} visit{activeCount === 1 ? '' : 's'}
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

          {HOURS.map((hour) => {
            const hourLabel = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

            return (
              <div key={hour} className="contents">
                <div className="sticky left-0 z-10 flex h-28 items-start justify-end border-r border-b bg-card/95 p-2 text-[11px] font-semibold text-muted-foreground backdrop-blur-md">
                  {hourLabel}
                </div>

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
                      className="group relative flex min-h-28 flex-col gap-1.5 border-r border-b bg-background/30 p-1.5 transition-all duration-150 hover:bg-primary/5 cursor-pointer"
                    >
                      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/20 transition-transform group-hover:scale-105">
                          <Plus className="size-3.5" /> Book {hourLabel}
                        </span>
                      </div>

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
                              'card-aura relative z-10 flex flex-col justify-between rounded-xl border bg-card p-2.5 text-left shadow-xs transition-all duration-200 cursor-pointer',
                              'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 hover:ring-1 hover:ring-primary/20 active:scale-[0.985]',
                              isCancelled && 'opacity-60 bg-muted/40 line-through',
                            )}
                            style={{
                              borderLeftWidth: '4px',
                              borderLeftColor: accent,
                            }}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                  {patientDisplayName(appt)}
                                </p>
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                  <Clock className="size-2.5" />
                                  {formatApptTimeRange(appt)}
                                </p>
                              </div>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0"
                              >
                                <AppointmentStatusSelect appointment={appt} compact />
                              </div>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                              {appt.service && (
                                <span className="inline-flex items-center gap-1 truncate font-medium text-foreground/80">
                                  <Stethoscope className="size-2.5 text-primary" />
                                  {appt.service.name}
                                </span>
                              )}
                              {appt.sessionType === 'online' ? (
                                <span className="inline-flex items-center gap-1 text-primary font-medium">
                                  <Video className="size-2.5" /> Online
                                </span>
                              ) : (
                                appt.room && (
                                  <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                                    <DoorOpen className="size-2.5" /> {appt.room.name}
                                  </span>
                                )
                              )}
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
