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
import { ScheduleLegend } from '@/components/blocks/appointments/schedule-legend';
import { CalendarSkeleton } from '@/components/blocks/appointments/calendar-skeleton';
import { DoctorTimeline } from '@/components/blocks/appointments/doctor-timeline';
import { WaitingQueueBoard } from '@/components/blocks/appointments/waiting-queue-board';
import { ViewFocus } from '@/components/blocks/appointments/view-focus';
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
  const haystack = `${appt.patient.firstNameEn} ${appt.patient.lastNameEn} ${appt.service?.name ?? ''} ${appt.doctor.name ?? ''}`;
  return haystack.toLowerCase().includes(term);
}

function SchedulePageInner() {
  const clinicId = useClinicId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [range, setRange] = useState(initialRange);

  const { data: clinic } = useClinic(clinicId);
  const { data: staff } = useClinicStaff(clinicId);
  const viewParam = searchParams.get('view');

  const [view, setCurrentView] = useState<ScheduleView>(() =>
    parseScheduleView(viewParam || clinic?.defaultCalendarView || 'month'),
  );

  const [prevParam, setPrevParam] = useState(viewParam);
  if (viewParam !== prevParam) {
    setPrevParam(viewParam);
    if (viewParam) {
      setCurrentView(parseScheduleView(viewParam));
    }
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

  const handleVisibleRangeChange = useCallback((start: Date, end: Date) => {
    const next = rangeFromVisible(start, end);
    setRange((prev) =>
      prev.startDate === next.startDate && prev.endDate === next.endDate
        ? prev
        : next,
    );
  }, []);

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
    (date?: Date, doctorId?: string) => {
      const params = new URLSearchParams();
      params.set('view', view);
      if (date) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        params.set('date', dateStr);
        params.set('time', timeStr);
      }
      if (doctorId) {
        params.set('doctorId', doctorId);
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
    <div className="flex min-h-0 flex-col gap-3">
      <ScheduleToolbar
        view={view}
        onViewChange={setView}
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

      {view !== 'queue' && (
        <ScheduleLegend activeStatuses={statusFilters} onToggleStatus={toggleStatus} />
      )}

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
    <div className="space-y-3">
      <div className="card-aura rounded-2xl border bg-card/90 p-2.5 sm:p-3 space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-9 w-full sm:w-64 rounded-xl bg-muted/60" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded-xl bg-muted/60" />
            <div className="h-9 w-32 rounded-xl bg-muted/60" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
          <div className="h-8 w-64 rounded-lg bg-muted/50" />
          <div className="h-8 w-48 rounded-lg bg-muted/50" />
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
