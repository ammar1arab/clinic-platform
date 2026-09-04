import {
  appointmentsService,
  AppointmentFilters,
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/services/appointments.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError, useApiMutation, INVALIDATE, LIVE_LIST_OPTIONS } from '../query';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useLanguage } from '@/providers';

export function useAppointments(filters: AppointmentFilters, enabled = true) {
  return useFetchData<Appointment[]>({
    queryKey: QUERY_KEYS.appointments.list(filters),
    request: () => appointmentsService.getAll(filters),
    options: {
      ...LIVE_LIST_OPTIONS,
      enabled,
    },
  });
}

export function useAppointment(id: string) {
  return useFetchData<Appointment>({
    queryKey: QUERY_KEYS.appointments.detail(id),
    request: () => appointmentsService.getOne(id),
    options: {
      enabled: !!id,
    },
  });
}

export function useCreateAppointment() {
  const { t } = useLanguage();
  return useApiMutation<Appointment, TResponseError, CreateAppointmentInput>({
    request: (data) => appointmentsService.create(data),
    invalidateQueries: [...INVALIDATE.appointmentWrite],
    successMessage: t.common.appointmentCreated,
  });
}

function applyOptimisticUpdate(
  current: Appointment,
  patch: UpdateAppointmentInput,
): Appointment {
  const nowIso = new Date().toISOString();
  const next: Appointment = {
    ...current,
    status: patch.status ?? current.status,
    scheduledAt: patch.scheduledAt ?? current.scheduledAt,
    durationMins: patch.durationMins ?? current.durationMins,
    doctorId: patch.doctorId ?? current.doctorId,
    roomId: patch.roomId !== undefined ? patch.roomId : current.roomId,
    serviceId: patch.serviceId !== undefined ? patch.serviceId : current.serviceId,
    notes: patch.notes !== undefined ? patch.notes : current.notes,
    cancelReason: patch.cancelReason !== undefined ? patch.cancelReason : current.cancelReason,
    statusUpdatedAt: patch.status ? nowIso : current.statusUpdatedAt,
    updatedAt: nowIso,
  };

  if (patch.status === 'in_progress' && !current.inProgressAt) {
    next.inProgressAt = nowIso;
  }
  if ((patch.status === 'waiting' || patch.status === 'checked_in') && !current.waitingStartedAt) {
    next.waitingStartedAt = nowIso;
  }
  return next;
}

interface UpdateAppointmentContext {
  previousLists: [QueryKey, Appointment[] | undefined][];
  previousDetail: Appointment | undefined;
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useApiMutation<
    Appointment,
    TResponseError,
    { id: string; data: UpdateAppointmentInput },
    UpdateAppointmentContext
  >({
    request: ({ id, data }) => appointmentsService.update(id, data),
    successMessage: t.common.appointmentUpdated,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.appointments.all });

      const previousLists = queryClient.getQueriesData<Appointment[]>({
        queryKey: QUERY_KEYS.appointments.all,
      });
      const previousDetail = queryClient.getQueryData<Appointment>(
        QUERY_KEYS.appointments.detail(id),
      );

      queryClient.setQueriesData<Appointment[]>(
        { queryKey: QUERY_KEYS.appointments.all },
        (old) => {
          if (!old) return old;
          return old.map((appt) =>
            appt.id === id ? applyOptimisticUpdate(appt, data) : appt,
          );
        },
      );

      if (previousDetail) {
        queryClient.setQueryData<Appointment>(
          QUERY_KEYS.appointments.detail(id),
          applyOptimisticUpdate(previousDetail, data),
        );
      }

      return { previousLists, previousDetail };
    },
    onError: (_err, { id }, context) => {
      if (!context) return;
      for (const [queryKey, oldData] of context.previousLists) {
        queryClient.setQueryData(queryKey, () => oldData);
      }
      if (context.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.appointments.detail(id),
          () => context.previousDetail,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      for (const key of INVALIDATE.appointmentWrite) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.appointments.detail(variables.id),
        });
      }
    },
  });
}

export function useMarkAppointmentPaid() {
  const { t } = useLanguage();
  return useApiMutation<
    Appointment,
    TResponseError,
    { id: string; paymentMethodId: string }
  >({
    request: ({ id, paymentMethodId }) =>
      appointmentsService.markPaid(id, paymentMethodId),
    invalidateQueries: [...INVALIDATE.appointmentPayment],
    successMessage: t.common.markedAsPaid,
  });
}

export function useMarkAppointmentUnpaid() {
  const { t } = useLanguage();
  return useApiMutation<Appointment, TResponseError, string>({
    request: (id) => appointmentsService.markUnpaid(id),
    invalidateQueries: [...INVALIDATE.appointmentPayment],
    successMessage: t.common.markedAsUnpaid,
  });
}

export function useRedeemAppointmentPackage() {
  const { t } = useLanguage();
  return useApiMutation<
    Appointment,
    TResponseError,
    { id: string; patientPackageId: string }
  >({
    request: ({ id, patientPackageId }) =>
      appointmentsService.redeemPackage(id, patientPackageId),
    invalidateQueries: [...INVALIDATE.appointmentPackage],
    successMessage: t.common.visitCoveredByPackage,
  });
}

export function useReleaseAppointmentPackage() {
  const { t } = useLanguage();
  return useApiMutation<Appointment, TResponseError, string>({
    request: (id) => appointmentsService.releasePackage(id),
    invalidateQueries: [...INVALIDATE.appointmentPackage],
    successMessage: t.common.packageCoverageRemoved,
  });
}
