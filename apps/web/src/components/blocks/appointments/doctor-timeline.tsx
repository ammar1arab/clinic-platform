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

  const dateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
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

  const apptsByDoctor = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (!appointments) return map;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    for (const appt of appointments) {
      const apptDate = new Date(appt.scheduledAt);
      if (apptDate >= startOfDay && apptDate <= endOfDay) {
        const docId = appt.doctorId;
        const list = map.get(docId) ?? [];
        list.push(appt);
        map.set(docId, list);
      }
    }
    return map;
  }, [appointments, selectedDate]);

  const nowHour = now.getHours();
  const nowMinutes = now.getMinutes();
  const isNowInSchedule = isToday && nowHour >= 7 && nowHour <= 20;
  const nowTopPercent = isNowInSchedule
    ? ((nowHour - 7 + nowMinutes / 60) / HOURS.length) * 100
    : null;

  if (isLoading && (!appointments || appointments.length === 0)) {
    return <TimelineSkeleton hours={7} columns={Math.min(4, Math.max(2, activeDoctors.length || 3))} />;
  }

  if (activeDoctors.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-xl border bg-card p-6 text-center shadow-xs">
        <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Users className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No doctors registered</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Add medical staff in Clinic Settings to view side-by-side doctor schedules.
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
    <div className="card-aura relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            disabled={isToday}
            className="transition-all active:scale-95 font-medium"
          >
            Today
          </Button>
          <div className="flex items-center gap-0.5 rounded-lg border bg-background/60 p-0.5">
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
          <span className="text-sm font-bold tracking-tight text-foreground">{dateLabel}</span>
          {isToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Today
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <User className="size-3.5 text-primary" />
            {activeDoctors.length} Doctor{activeDoctors.length === 1 ? '' : 's'}
          </span>
          <span>·</span>
          <span className="text-muted-foreground">Click any empty slot to book</span>
        </div>
      </div>

      <div className="relative max-h-[75vh] min-h-125 overflow-auto">
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `76px repeat(${activeDoctors.length}, minmax(260px, 1fr))`,
            minWidth: `${76 + activeDoctors.length * 260}px`,
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

          <div className="sticky top-0 left-0 z-30 flex items-center justify-center border-r border-b bg-card/95 p-3 text-xs font-bold text-muted-foreground backdrop-blur-md shadow-xs">
            <Clock className="size-4" />
          </div>

          {activeDoctors.map((doc) => {
            const docAppts = apptsByDoctor.get(doc.id) ?? [];
            const activeCount = docAppts.filter((a) => a.status !== 'cancelled').length;

            return (
              <div
                key={doc.id}
                className="sticky top-0 z-20 flex items-center justify-between border-r border-b bg-card/95 p-3.5 backdrop-blur-md shadow-xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/20">
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

                {activeDoctors.map((doc) => {
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
                      className="group relative flex min-h-28 flex-col gap-1.5 border-r border-b bg-background/40 p-1.5 transition-all duration-150 hover:bg-primary/4 cursor-pointer"
                    >
                      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary shadow-sm ring-1 ring-primary/20 transition-transform group-hover:scale-105">
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
                              'relative z-10 flex flex-col justify-between rounded-lg border bg-card p-2.5 text-left shadow-xs transition-all duration-200 cursor-pointer',
                              'hover:shadow-lg hover:border-primary/50 hover:scale-[1.015] active:scale-[0.99]',
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
