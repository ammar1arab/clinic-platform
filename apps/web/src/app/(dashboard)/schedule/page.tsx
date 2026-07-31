'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppointments } from '@/hooks/use-appointments';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useClinicRealtime } from '@/hooks/use-clinic-realtime';
import { useDepartments } from '@/hooks/use-departments';
import { useDebounce } from '@/hooks/use-debounce';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { ROUTES } from '@/constants/routes';
import { ScheduleToolbar } from '@/components/blocks/appointments/schedule-toolbar';
import { ScheduleLegend } from '@/components/blocks/appointments/schedule-legend';
import { CalendarSkeleton } from '@/components/blocks/appointments/calendar-skeleton';
import {
  parseScheduleView,
  schedulePath,
  type ScheduleView,
} from '@/components/blocks/appointments/schedule-nav';

const AppointmentCalendar = dynamic(
  () =>
    import('@/components/blocks/appointments/appointment-calendar').then(
      (m) => m.AppointmentCalendar,
    ),
  {
    ssr: false,
    loading: () => <CalendarSkeleton />,
  },
);


function rangeFromVisible(start: Date, end: Date) {
  const from = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const to = new Date(end.getFullYear(), end.getMonth() + 2, 0);
  return { startDate: from.toISOString(), endDate: to.toISOString() };
}

function initialRange() {
  const now = new Date();
  return rangeFromVisible(
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 0),
  );
}

function matchesSearch(appt: Appointment, term: string) {
  const haystack = `${appt.patient.firstNameEn} ${appt.patient.lastNameEn} ${appt.service?.name ?? ''}`;
  return haystack.toLowerCase().includes(term);
}

function SchedulePageInner() {
  const clinicId = useClinicId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [range, setRange] = useState(initialRange);
  const rangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const view = parseScheduleView(searchParams.get('view'));
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<AppointmentStatus>>(
    () => new Set(),
  );
  const debouncedSearch = useDebounce(search, 250);

  useClinicRealtime(clinicId);

  const { data: departments } = useDepartments(clinicId);
  const { data: appointments, isLoading, isFetching } = useAppointments(
    {
      startDate: range.startDate,
      endDate: range.endDate,
      departmentId: departmentId || undefined,
    },
    !!clinicId,
  );

  const setView = useCallback(
    (next: ScheduleView) => {
      if (next === view) return;
      router.replace(schedulePath(next), { scroll: false });
    },
    [router, view],
  );

  const toggleStatus = useCallback((status: AppointmentStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const handleVisibleRangeChange = useCallback((start: Date, end: Date) => {
    const next = rangeFromVisible(start, end);
    if (rangeTimer.current) clearTimeout(rangeTimer.current);
    rangeTimer.current = setTimeout(() => {
      setRange((prev) =>
        prev.startDate === next.startDate && prev.endDate === next.endDate
          ? prev
          : next,
      );
    }, 180);
  }, []);

  useEffect(
    () => () => {
      if (rangeTimer.current) clearTimeout(rangeTimer.current);
    },
    [],
  );

  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (statusFilters.size > 0) {
      list = list?.filter((appt) => statusFilters.has(appt.status));
    }
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return list;
    return list?.filter((appt) => matchesSearch(appt, term));
  }, [appointments, debouncedSearch, statusFilters]);

  const returnTo = schedulePath(view);

  const goNewAppointment = useCallback(
    (date?: Date) => {
      const params = new URLSearchParams();
      params.set('view', view);
      if (date) {
        params.set('date', date.toISOString().slice(0, 10));
        params.set('time', date.toTimeString().slice(0, 5));
      }
      router.push(`${ROUTES.SCHEDULE_NEW}?${params.toString()}`);
    },
    [router, view],
  );

  const handleEventClick = useCallback(
    (appt: Appointment) => {
      router.push(`${ROUTES.SCHEDULE_EDIT(appt.id)}?view=${view}`);
    },
    [router, view],
  );

  return (
    <div className="space-y-3">
      <ScheduleToolbar
        search={search}
        onSearchChange={setSearch}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        departments={departments}
        count={filteredAppointments?.length ?? 0}
        isLoading={isLoading}
        onNewPatient={() =>
          router.push(
            `${ROUTES.PATIENT_NEW}?returnTo=${encodeURIComponent(returnTo)}`,
          )
        }
        onNewAppointment={() => goNewAppointment()}
      />

      <ScheduleLegend activeStatuses={statusFilters} onToggleStatus={toggleStatus} />

      <AppointmentCalendar
        appointments={filteredAppointments}
        isLoading={isLoading}
        isFetching={isFetching}
        view={view}
        onViewChange={setView}
        onVisibleRangeChange={handleVisibleRangeChange}
        onEventClick={handleEventClick}
        onSelectSlot={goNewAppointment}
      />
    </div>
  );
}

function ScheduleFallback() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="h-9 min-w-0 flex-1 rounded-md bg-muted/60 sm:max-w-56" />
          <div className="h-9 w-36 shrink-0 rounded-md bg-muted/60 sm:w-44" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-28 rounded bg-muted/50" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-md bg-muted/60" />
            <div className="h-8 w-28 rounded-md bg-muted/60" />
          </div>
        </div>
      </div>
      <CalendarSkeleton />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleFallback />}>
      <SchedulePageInner />
    </Suspense>
  );
}
