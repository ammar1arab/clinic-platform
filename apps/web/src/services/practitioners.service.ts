import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  AssignServicesInput,
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  ReplaceAvailabilityInput,
  ReplaceTimeOffInput,
  UpdatePractitionerInput,
} from "@clinic/types";

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
      .get<
        Practitioner[]
      >(ENDPOINTS.PRACTITIONERS.BASE, { params: { clinicId } })
      .then((r) => r.data),

  getOne: (id: string) =>
    api
      .get<PractitionerDetail>(ENDPOINTS.PRACTITIONERS.BY_ID(id))
      .then((r) => r.data),

  create: (data: CreatePractitionerInput) =>
    api
      .post<CreatePractitionerResult>(ENDPOINTS.PRACTITIONERS.BASE, data)
      .then((r) => r.data),

  update: (id: string, data: UpdatePractitionerInput) =>
    api
      .patch<PractitionerDetail>(ENDPOINTS.PRACTITIONERS.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.PRACTITIONERS.DEACTIVATE(id)).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(ENDPOINTS.PRACTITIONERS.REACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.PRACTITIONERS.BY_ID(id)).then((r) => r.data),

  replaceServices: (id: string, data: AssignServicesInput) =>
    api
      .put<PractitionerDetail>(
        ENDPOINTS.PRACTITIONERS.REPLACE_SERVICES(id),
        data,
      )
      .then((r) => r.data),

  replaceAvailability: (id: string, data: ReplaceAvailabilityInput) =>
    api
      .put<PractitionerDetail>(
        ENDPOINTS.PRACTITIONERS.REPLACE_AVAILABILITY(id),
        data,
      )
      .then((r) => r.data),

  replaceTimeOff: (id: string, data: ReplaceTimeOffInput) =>
    api
      .put<PractitionerDetail>(
        ENDPOINTS.PRACTITIONERS.REPLACE_TIME_OFF(id),
        data,
      )
      .then((r) => r.data),
};
