import type { CreateScheduleRequestInput, ReviewScheduleRequestInput, ScheduleRequestPage } from "@clinic/types";
import type { Translations } from '@/i18n';
import { practitionersService } from '@/services/practitioners.service';
import type {
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  PractitionerFilters,
  UpdatePractitionerInput,
  PractitionerSelfProfileInput,
} from '@/services/practitioners.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useLanguage } from '@/providers';
import {
  createCrudHooks,
  LIVE_LIST_OPTIONS,
  useFetchData,
  useApiMutation,
} from '../query';

const writeKeys = (clinicId: string, id?: string) => [
  QUERY_KEYS.practitioners.all,
  QUERY_KEYS.practitioners.list(clinicId),
  QUERY_KEYS.clinics.staff(clinicId),
  QUERY_KEYS.appointments.all,
  QUERY_KEYS.patients.all,
  ...(id ? [QUERY_KEYS.practitioners.detail(id)] : []),
];

const {
  useList: usePractitioners,
  useUpdate: useUpdatePractitioner,
  useRemove: useDeletePractitioner,
  useDeactivate: useDeactivatePractitioner,
  useReactivate: useReactivatePractitioner,
} = createCrudHooks<Practitioner, CreatePractitionerInput, UpdatePractitionerInput>({
  keys: QUERY_KEYS.practitioners,
  entity: 'practitioner',
  labels: (t: Translations) => ({ removed: t.common.practitionerDeleted }),
  service: {
    getAll: practitionersService.getAll,
    create: (data) =>
      practitionersService.create(data).then((r) => r.practitioner),
    update: practitionersService.update,
    remove: practitionersService.remove,
    deactivate: practitionersService.deactivate,
    reactivate: practitionersService.reactivate,
  },
  invalidateOnWrite: (clinicId) => writeKeys(clinicId),
});

export function usePractitionerDirectory(filters: PractitionerFilters) {
  return useFetchData<Practitioner[]>({
    queryKey: QUERY_KEYS.practitioners.directory(filters),
    request: () => practitionersService.getDirectory(filters),
    options: { ...LIVE_LIST_OPTIONS, enabled: !!filters.clinicId },
  });
}

export function usePractitioner(id: string) {
  return useFetchData<PractitionerDetail>({
    queryKey: QUERY_KEYS.practitioners.detail(id),
    request: () => practitionersService.getOne(id),
    options: { enabled: !!id },
  });
}

export function useUpdatePractitionerSelfProfile(clinicId: string, id: string) {
  const { t } = useLanguage();
  return useApiMutation<PractitionerDetail, Error, PractitionerSelfProfileInput>({
    request: (data) => practitionersService.updateSelfProfile(id, data),
    invalidateQueries: [
      QUERY_KEYS.practitioners.detail(id),
      QUERY_KEYS.practitioners.all,
      QUERY_KEYS.practitioners.list(clinicId),
      QUERY_KEYS.clinics.staff(clinicId),
    ],
    successMessage: t.common.clinicSettingsSaved,
  });
}

export function useCreatePractitioner(clinicId: string) {
  return useApiMutation<CreatePractitionerResult, Error, CreatePractitionerInput>({
    request: (data) => practitionersService.create(data),
    invalidateQueries: writeKeys(clinicId),
    successMessage: 'Practitioner created',
  });
}

export {
  usePractitioners,
  useUpdatePractitioner,
  useDeletePractitioner,
  useDeactivatePractitioner,
  useReactivatePractitioner,
};

export function useScheduleRequests(clinicId: string, doctorId?: string, group = 'pending', page = 1, connected = false) {
  return useFetchData<ScheduleRequestPage>({
    queryKey: QUERY_KEYS.practitioners.requests(clinicId, doctorId, group, page),
    request: () => practitionersService.scheduleRequests(doctorId, group, page),
    options: { enabled: !!clinicId, refetchInterval: connected ? false : 30_000, refetchOnWindowFocus: true },
  });
}

export function useScheduleRequestMutation(clinicId: string) {
  const { t } = useLanguage();
  return useApiMutation<unknown, Error, CreateScheduleRequestInput | { id: string; data: ReviewScheduleRequestInput }>({
    request: (input) => 'id' in input ? practitionersService.reviewSchedule(input.id, input.data) : practitionersService.requestSchedule(input),
    invalidateQueries: [...writeKeys(clinicId), QUERY_KEYS.dashboard.kpisAll, QUERY_KEYS.dashboard.roomUtilizationAll],
    successMessage: t.scheduleRequests.saved,
  });
}
