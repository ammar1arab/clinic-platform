import { practitionersService } from '@/services/practitioners.service';
import type {
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  UpdatePractitionerInput,
} from '@/services/practitioners.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks, useFetchData, useApiMutation } from '@/core/api/query';

const writeKeys = (clinicId: string, id?: string) => [
  QUERY_KEYS.practitioners.list(clinicId),
  QUERY_KEYS.clinics.staff(clinicId),
  ...(id ? [QUERY_KEYS.practitioners.detail(id)] : []),
];

const {
  useList: usePractitioners,
  useUpdate: useUpdatePractitioner,
  useDeactivate: useDeactivatePractitioner,
  useReactivate: useReactivatePractitioner,
} = createCrudHooks<Practitioner, CreatePractitionerInput, UpdatePractitionerInput>({
  keys: QUERY_KEYS.practitioners,
  entity: 'Practitioner',
  service: {
    getAll: practitionersService.getAll,
    create: (data) =>
      practitionersService.create(data).then((r) => r.practitioner),
    update: practitionersService.update,
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
  useDeactivatePractitioner,
  useReactivatePractitioner,
};