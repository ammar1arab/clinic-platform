"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppointments } from "@/hooks/api/use-appointments";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useClinic } from "@/hooks/api/use-clinic";
import { useClinicStaff } from "@/hooks/api/use-clinic-staff";
import { useClinicRealtime } from "@/hooks/api/use-clinic-realtime";
import { useDepartments } from "@/hooks/api/use-departments";
import { useSessionStorageState } from "@/hooks/shared/use-session-storage-state";
import {
  Appointment,
  AppointmentStatus,
} from "@/services/appointments.service";
import { ROUTES } from "@/constants/routes";
import {
  ScheduleToolbar,
  CalendarSkeleton,
  DoctorTimeline,
  WaitingQueueBoard,
  ViewFocus,
  initialScheduleRange,
  parseScheduleView,
  rangeFromVisible,
  schedulePath,
  type ScheduleView,
  matchesAppointmentSearch,
} from "@/components/blocks/appointments";
import { toDateParam, toTimeParam } from "@/lib/datetime";
import { useAuth, useLanguage } from "@/providers";
import { ROLE } from "@clinic/types";
import { ErrorState } from "@/components/primitives";

const AppointmentCalendar = dynamic(
  () =>
    import("@/components/blocks/appointments/schedule/appointment-calendar").then(
      (m) => m.AppointmentCalendar,
    ),
  { ssr: false, loading: () => <CalendarSkeleton /> },
);

function SchedulePageInner() {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPractitioner = user?.role === ROLE.PRACTITIONER;
  const practitionerId = isPractitioner ? user.clinicUserId : undefined;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: clinic } = useClinic(clinicId);
  const { data: staff } = useClinicStaff(clinicId, !isPractitioner);
  const practitioners = useMemo(
    () => staff?.filter((member) => member.role === "practitioner"),
    [staff],
  );
  const viewParam = searchParams.get("view");

  const [view, setCurrentView] = useSessionStorageState<ScheduleView>(
    `${clinicId || "none"}:schedule-view`,
    parseScheduleView(clinic?.defaultCalendarView || "month"),
  );
  const [range, setRange] = useSessionStorageState(
    `${clinicId || "none"}:schedule-range`,
    initialScheduleRange(),
  );
  const [search, setSearch] = useSessionStorageState(`${clinicId || "none"}:schedule-search`, "");
  const [departmentId, setDepartmentId] = useSessionStorageState(
    `${clinicId || "none"}:schedule-department`,
    "",
  );

  const [pickerSlot, setPickerSlot] = useState<HTMLDivElement | null>(null);
  const [prevParam, setPrevParam] = useState<string | null>(null);
  if (viewParam !== prevParam) {
    setPrevParam(viewParam);
    if (viewParam) setCurrentView(parseScheduleView(viewParam));
  }

  const [statusFilters, setStatusFilters] = useSessionStorageState<AppointmentStatus[]>(`${clinicId || "none"}:schedule-status-filters`, []);
  const activeView = isPractitioner && view === "doctors" ? "month" : view;
  useClinicRealtime(clinicId);

  const { data: departments } = useDepartments(clinicId);
  const {
    data: appointments,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAppointments(
    {
      startDate: range.startDate,
      endDate: range.endDate,
      departmentId: departmentId || undefined,
      doctorId: practitionerId,
    },
    !!clinicId && !!user,
  );

  const setView = useCallback(
    (next: ScheduleView) => {
      setCurrentView(next);
      router.replace(schedulePath(next), { scroll: false });
    },
    [router, setCurrentView],
  );

  const toggleStatus = useCallback((status: AppointmentStatus) => {
    setStatusFilters((prev) => {
      return prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status];
    });
  }, [setStatusFilters]);

  const clearStatuses = useCallback(() => setStatusFilters([]), [setStatusFilters]);

  const handleVisibleRangeChange = useCallback((start: Date, end: Date) => {
    const next = rangeFromVisible(start, end);
    setRange((prev) =>
      prev.startDate === next.startDate && prev.endDate === next.endDate
        ? prev
        : next,
    );
  }, [setRange]);

  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (statusFilters.length > 0) {
      list = list?.filter((appt) => statusFilters.includes(appt.status));
    }
    return list?.filter((appt) =>
      matchesAppointmentSearch(appt, search),
    );
  }, [appointments, search, statusFilters]);

  const returnTo = schedulePath(activeView);

  const goNewAppointment = useCallback(
    (date?: Date, doctorId?: string) => {
      if (isPractitioner) return;
      const params = new URLSearchParams({ view: activeView });
      if (date) {
        params.set("date", toDateParam(date));
        params.set("time", toTimeParam(date));
      }
      if (doctorId) params.set("doctorId", doctorId);
      router.push(`${ROUTES.SCHEDULE_NEW}?${params.toString()}`);
    },
    [activeView, isPractitioner, router],
  );

  const handleEventClick = useCallback(
    (appt: Appointment) => {
      router.push(isPractitioner ? ROUTES.VISIT(appt.id) : `${ROUTES.SCHEDULE_EDIT(appt.id)}?view=${activeView}`);
    },
    [activeView, isPractitioner, router],
  );

  const toolbar = (
    <ScheduleToolbar
      view={activeView}
      search={search}
      onSearchChange={setSearch}
      departmentId={departmentId}
      onDepartmentChange={setDepartmentId}
      departments={departments}
      statusFilters={new Set(statusFilters)}
      onToggleStatus={toggleStatus}
      onClearStatuses={clearStatuses}
      pickerSlotRef={setPickerSlot}
      {...(!isPractitioner && {
        onNewPatient: () =>
          router.push(
            `${ROUTES.PATIENT_NEW}?returnTo=${encodeURIComponent(returnTo)}`,
          ),
        onNewAppointment: () => goNewAppointment(),
      })}
    />
  );

  const focusLabel =
    activeView === "doctors"
      ? t.appointments.doctorTimeline
      : activeView === "queue"
        ? t.queue.waitingQueue
        : t.appointments.calendar;

  return (
    <div className="page-fill h-0 min-h-0 flex-1 overflow-hidden">
      <ViewFocus label={focusLabel} storageKey={`${clinicId || "none"}:schedule-${activeView === 'doctors' || activeView === 'queue' ? activeView : 'calendar'}`}>
        {(focused) => (
          <>
            {toolbar}
            {isError && !appointments ? (
              <ErrorState onRetry={() => void refetch()} className="page-fill" />
            ) : activeView === "doctors" ? (
              <DoctorTimeline
                appointments={filteredAppointments}
                doctors={practitioners}
                isLoading={isLoading}
                focused={focused}
                canManageAppointments={!isPractitioner}
                onSelectSlot={goNewAppointment}
                onEventClick={handleEventClick}
                toolbarSlot={pickerSlot}
              />
            ) : activeView === "queue" ? (
              <WaitingQueueBoard
                appointments={filteredAppointments}
                isLoading={isLoading}
                focused={focused}
                canManagePayments={!isPractitioner}
                onEventClick={handleEventClick}
                toolbarSlot={pickerSlot}
              />
            ) : (
              <AppointmentCalendar
                appointments={filteredAppointments}
                isLoading={isLoading}
                isFetching={isFetching}
                view={activeView}
                focused={focused}
                canManageAppointments={!isPractitioner}
                onViewChange={setView}
                onVisibleRangeChange={handleVisibleRangeChange}
                onEventClick={handleEventClick}
                onSelectSlot={goNewAppointment}
                hours={
                  clinic
                    ? { start: clinic.workingHoursStart, end: clinic.workingHoursEnd }
                    : undefined
                }
              />
            )}
          </>
        )}
      </ViewFocus>
    </div>
  );
}

function ScheduleFallback() {
  return (
    <div className="page-fill h-0 flex-1 min-h-0 gap-2 overflow-hidden">
      <div className="card-aura space-y-1.5 rounded-xl border bg-card/90 p-1.5 sm:p-2">
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
