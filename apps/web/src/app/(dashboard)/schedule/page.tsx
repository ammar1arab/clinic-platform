'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppointments } from '@/hooks/use-appointments';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useClinic } from '@/hooks/use-clinic';
import { useClinicStaff } from '@/hooks/use-clinic-staff';
import { useClinicRealtime } from '@/hooks/use-clinic-realtime';
import { useDepartments } from '@/hooks/use-departments';
import { useDebounce } from '@/hooks/use-debounce';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { ROUTES } from '@/constants/routes';
import { ScheduleToolbar } from '@/components/blocks/appointments/schedule-toolbar';
import { CalendarSkeleton } from '@/components/blocks/appointments/calendar-skeleton';
import { DoctorTimeline } from '@/components/blocks/appointments/doctor-timeline';
import { WaitingQueueBoard } from '@/components/blocks/appointments/waiting-queue-board';
import { ViewFocus } from '@/components/blocks/appointments/view-focus';
import {
  initialScheduleRange,
  parseScheduleView,
  rangeFromVisible,
  schedulePath,
  type ScheduleView,
} from '@/components/blocks/appointments/schedule-nav';
import {
  matchesAppointmentSearch,
  toDateParam,
  toTimeParam,
} from '@/components/blocks/appointments/appointment-display';

const AppointmentCalendar = dynamic(
  () =>
    import('@/components/blocks/appointments/appointment-calendar').then(
      (m) => m.AppointmentCalendar,
    ),
  { ssr: false, loading: () => <CalendarSkeleton /> },
);

function SchedulePageInner() {
  const clinicId = useClinicId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [range, setRange] = useState(initialScheduleRange);

  const { data: clinic } = useClinic(clinicId);
  const { data: staff } = useClinicStaff(clinicId);
  const viewParam = searchParams.get('view');

  const [view, setCurrentView] = useState<ScheduleView>(() =>
    parseScheduleView(viewParam || clinic?.defaultCalendarView || 'month'),
  );

  const [prevParam, setPrevParam] = useState(viewParam);
  if (viewParam !== prevParam) {
    setPrevParam(viewParam);
    if (viewParam) setCurrentView(parseScheduleView(viewParam));
  }

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
      setCurrentView(next);
      router.replace(schedulePath(next), { scroll: false });
    },
    [router],
  );

  const toggleStatus = useCallback((status: AppointmentStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const clearStatuses = useCallback(() => setStatusFilters(new Set()), []);

  const handleVisibleRangeChange = useCallback((start: Date, end: Date) => {
    const next = rangeFromVisible(start, end);
    setRange((prev) =>
      prev.startDate === next.startDate && prev.endDate === next.endDate ? prev : next,
    );
  }, []);

  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (statusFilters.size > 0) {
      list = list?.filter((appt) => statusFilters.has(appt.status));
    }
    return list?.filter((appt) => matchesAppointmentSearch(appt, debouncedSearch));
  }, [appointments, debouncedSearch, statusFilters]);

  const returnTo = schedulePath(view);

  const goNewAppointment = useCallback(
    (date?: Date, doctorId?: string) => {
      const params = new URLSearchParams({ view });
      if (date) {
        params.set('date', toDateParam(date));
        params.set('time', toTimeParam(date));
      }
      if (doctorId) params.set('doctorId', doctorId);
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
    <div className="flex min-h-0 flex-col gap-2">
      <ScheduleToolbar
        view={view}
        onViewChange={setView}
        search={search}
        onSearchChange={setSearch}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        departments={departments}
        statusFilters={statusFilters}
        onToggleStatus={toggleStatus}
        onClearStatuses={clearStatuses}
        count={filteredAppointments?.length ?? 0}
        isLoading={isLoading}
        onNewPatient={() =>
          router.push(
            `${ROUTES.PATIENT_NEW}?returnTo=${encodeURIComponent(returnTo)}`,
          )
        }
        onNewAppointment={() => goNewAppointment()}
      />

      {view === 'doctors' ? (
        <ViewFocus label="Doctor timeline">
          {(focused) => (
            <DoctorTimeline
              appointments={filteredAppointments}
              doctors={staff}
              isLoading={isLoading}
              focused={focused}
              onSelectSlot={goNewAppointment}
              onEventClick={handleEventClick}
            />
          )}
        </ViewFocus>
      ) : view === 'queue' ? (
        <ViewFocus label="Waiting board">
          {(focused) => (
            <WaitingQueueBoard
              appointments={filteredAppointments}
              isLoading={isLoading}
              focused={focused}
              onEventClick={handleEventClick}
            />
          )}
        </ViewFocus>
      ) : (
        <ViewFocus label="Calendar">
          {(focused) => (
            <AppointmentCalendar
              appointments={filteredAppointments}
              isLoading={isLoading}
              isFetching={isFetching}
              view={view}
              focused={focused}
              onViewChange={setView}
              onVisibleRangeChange={handleVisibleRangeChange}
              onEventClick={handleEventClick}
              onSelectSlot={goNewAppointment}
            />
          )}
        </ViewFocus>
      )}
    </div>
  );
}

function ScheduleFallback() {
  return (
    <div className="space-y-2">
      <div className="card-aura space-y-2 rounded-xl border bg-card/90 p-2 sm:p-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-full rounded-lg bg-muted/60 sm:w-64" />
          <div className="flex gap-1.5">
            <div className="h-8 w-24 rounded-lg bg-muted/60" />
            <div className="h-8 w-28 rounded-lg bg-muted/60" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t pt-2">
          <div className="h-8 w-48 rounded-lg bg-muted/50" />
          <div className="h-8 w-36 rounded-lg bg-muted/50" />
          <div className="h-8 w-28 rounded-lg bg-muted/50" />
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
