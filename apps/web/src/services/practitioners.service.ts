import { api } from '@/lib/api';
import type {
  AssignServicesInput,
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  ReplaceAvailabilityInput,
  ReplaceTimeOffInput,
  UpdatePractitionerInput,
} from '@clinic/types';

export type {
  AssignServicesInput,
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  ReplaceAvailabilityInput,
  ReplaceTimeOffInput,
  UpdatePractitionerInput,
};

export const practitionersService = {
  getAll: (clinicId: string) =>
    api
      .get<Practitioner[]>('/practitioners', { params: { clinicId } })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<PractitionerDetail>(`/practitioners/${id}`).then((r) => r.data),

  create: (data: CreatePractitionerInput) =>
    api
      .post<CreatePractitionerResult>('/practitioners', data)
      .then((r) => r.data),

  update: (id: string, data: UpdatePractitionerInput) =>
    api
      .patch<PractitionerDetail>(`/practitioners/${id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/practitioners/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(`/practitioners/${id}/reactivate`).then((r) => r.data),

  replaceServices: (id: string, data: AssignServicesInput) =>
    api
      .put<PractitionerDetail>(`/practitioners/${id}/services`, data)
      .then((r) => r.data),

  replaceAvailability: (id: string, data: ReplaceAvailabilityInput) =>
    api
      .put<PractitionerDetail>(`/practitioners/${id}/availability`, data)
      .then((r) => r.data),

  replaceTimeOff: (id: string, data: ReplaceTimeOffInput) =>
    api
      .put<PractitionerDetail>(`/practitioners/${id}/time-off`, data)
      .then((r) => r.data),
};
