import type { Translations } from '@/i18n';
import { practitionersService } from '@/services/practitioners.service';
import type {
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  UpdatePractitionerInput,
} from '@/services/practitioners.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks, useFetchData, useApiMutation } from '../query';

const writeKeys = (clinicId: string, id?: string) => [
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

export function usePractitioner(id: string) {
  return useFetchData<PractitionerDetail>({
    queryKey: QUERY_KEYS.practitioners.detail(id),
    request: () => practitionersService.getOne(id),
    options: { enabled: !!id },
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
