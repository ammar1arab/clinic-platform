import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  appointmentsService,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/services/appointments.service';
import { QUERY_KEYS } from '@/constants/query-keys';

export function useAppointments(filters: AppointmentFilters, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.appointments.list(filters),
    queryFn: () => appointmentsService.getAll(filters),
    enabled,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.appointments.detail(id),
    queryFn: () => appointmentsService.getOne(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentInput) => appointmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.kpisAll });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.roomUtilizationAll });
      toast.success('Appointment created');
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentInput }) =>
      appointmentsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.kpisAll });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.roomUtilizationAll });
      toast.success('Appointment updated');
    },
  });
}

export function useMarkAppointmentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentMethodId }: { id: string; paymentMethodId: string }) =>
      appointmentsService.markPaid(id, paymentMethodId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.detail(res.id) });
      toast.success('Marked as paid');
    },
  });
}

export function useMarkAppointmentUnpaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.markUnpaid(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.detail(res.id) });
      toast.success('Marked as unpaid');
    },
  });
}

export function useRedeemAppointmentPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patientPackageId }: { id: string; patientPackageId: string }) =>
      appointmentsService.redeemPackage(id, patientPackageId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.detail(res.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.patientPackages.summary(res.patientId),
      });
      toast.success('Visit covered by package');
    },
    onError: () => {

    },
  });
}

export function useReleaseAppointmentPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.releasePackage(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.detail(res.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.patientPackages.summary(res.patientId),
      });
      toast.success('Package coverage removed');
    },
  });
}

