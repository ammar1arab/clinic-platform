import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CreateRoomInput, Room, UpdateRoomInput } from "@clinic/types";

export type { CreateRoomInput, Room, UpdateRoomInput };

export const roomsService = {
  getAll: (clinicId: string) =>
    api
      .get<Room[]>(ENDPOINTS.ROOMS.BASE, { params: { clinicId } })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<Room>(ENDPOINTS.ROOMS.BY_ID(id)).then((r) => r.data),

  create: (data: CreateRoomInput) =>
    api.post<Room>(ENDPOINTS.ROOMS.BASE, data).then((r) => r.data),

  update: (id: string, data: UpdateRoomInput) =>
    api.patch<Room>(ENDPOINTS.ROOMS.BY_ID(id), data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.ROOMS.DEACTIVATE(id)).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(ENDPOINTS.ROOMS.REACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.ROOMS.BY_ID(id)).then((r) => r.data),
};
