import type { CreateScheduleRequestInput, ReviewScheduleRequestInput, ScheduleRequestPage } from "@clinic/types";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import { z } from "zod";
import type {
  AssignServicesInput,
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  PractitionerFilters,
  ReplaceAvailabilityInput,
  ReplaceTimeOffInput,
  UpdatePractitionerInput,
  PractitionerSelfProfileInput,
} from "@clinic/types";

export type {
  AssignServicesInput,
  CreatePractitionerInput,
  CreatePractitionerResult,
  Practitioner,
  PractitionerDetail,
  PractitionerFilters,
  ReplaceAvailabilityInput,
  ReplaceTimeOffInput,
  UpdatePractitionerInput,
  PractitionerSelfProfileInput,
};

export type ScheduleRequestGroup = 'all' | 'pending' | 'history';
export type ScheduleRequestSort = 'newest' | 'oldest';
export const scheduleRequestViewSchema = z.object({
  group: z.enum(['all', 'pending', 'history']).catch('all'),
  kind: z.enum(['', 'leave', 'vacation', 'extra']).catch(''),
  departmentId: z.union([z.literal(''), z.uuid()]).catch(''),
  sort: z.enum(['newest', 'oldest']).catch('newest'),
  page: z.number().int().min(1).max(100000).catch(1),
});
export type ScheduleRequestListFilters = {
  group: ScheduleRequestGroup;
  departmentId?: string;
  sort: ScheduleRequestSort;
  page: number;
  kind?: 'leave' | 'vacation' | 'extra';
  search?: string;
};

export const practitionersService = {
  scheduleRequests: (doctorId: string | undefined, filters: ScheduleRequestListFilters) =>
    api
      .get<ScheduleRequestPage>(ENDPOINTS.PRACTITIONERS.SCHEDULE_REQUESTS, {
        params: { doctorId, departmentId: filters.departmentId, group: filters.group === 'all' ? undefined : filters.group, sort: filters.sort === 'newest' ? undefined : filters.sort, page: filters.page, kind: filters.kind, search: filters.search || undefined },
      })
      .then((r) => r.data),
  requestSchedule: (data: CreateScheduleRequestInput) => api.post(ENDPOINTS.PRACTITIONERS.SCHEDULE_REQUESTS, data).then((r) => r.data),
  reviewSchedule: (id: string, data: ReviewScheduleRequestInput) => api.patch(ENDPOINTS.PRACTITIONERS.SCHEDULE_REQUEST(id), data).then((r) => r.data),

  getAll: () =>
    api
      .get<
        Practitioner[]
      >(ENDPOINTS.PRACTITIONERS.BASE)
      .then((r) => r.data),

  getDirectory: (filters: PractitionerFilters) => {
    const { clinicId, ...query } = filters;
    void clinicId;
    return api
      .get<Practitioner[]>(ENDPOINTS.PRACTITIONERS.BASE, { params: query })
      .then((r) => r.data);
  },

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

  updateSelfProfile: (id: string, data: PractitionerSelfProfileInput) =>
    api
      .patch<PractitionerDetail>(ENDPOINTS.PRACTITIONERS.SELF_PROFILE(id), data)
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
