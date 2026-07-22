'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
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
import { AppointmentCalendar } from '@/components/blocks/appointments/appointment-calendar';
import {
  parseScheduleView,
  schedulePath,
  type ScheduleView,
} from '@/components/blocks/appointments/schedule-nav';

/** Visible range ± 1 month buffer so prev/next months stay warm. */
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

  const goNewAppointment = (date?: Date) => {
    const params = new URLSearchParams();
    params.set('view', view);
    if (date) {
      params.set('date', date.toISOString().slice(0, 10));
      params.set('time', date.toTimeString().slice(0, 5));
    }
    router.push(`${ROUTES.SCHEDULE_NEW}?${params.toString()}`);
  };

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
        onVisibleRangeChange={(start, end) => {
          const next = rangeFromVisible(start, end);
          setRange((prev) =>
            prev.startDate === next.startDate && prev.endDate === next.endDate
              ? prev
              : next,
          );
        }}
        onEventClick={(appt) =>
          router.push(
            `${ROUTES.SCHEDULE_EDIT(appt.id)}?view=${view}`,
          )
        }
        onSelectSlot={(date) => goNewAppointment(date)}
      />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <SchedulePageInner />
    </Suspense>
  );
}
