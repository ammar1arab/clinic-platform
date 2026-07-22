import { api } from '@/lib/api';
import type { CreateRoomInput, Room, UpdateRoomInput } from '@clinic/types';

export type { CreateRoomInput, Room, UpdateRoomInput };

export const roomsService = {
  getAll: (clinicId: string) =>
    api.get<Room[]>('/rooms', { params: { clinicId } }).then((r) => r.data),

  getOne: (id: string) =>
    api.get<Room>(`/rooms/${id}`).then((r) => r.data),

  create: (data: CreateRoomInput) =>
    api.post<Room>('/rooms', data).then((r) => r.data),

  update: (id: string, data: UpdateRoomInput) =>
    api.patch<Room>(`/rooms/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/rooms/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(`/rooms/${id}/reactivate`).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/rooms/${id}`).then((r) => r.data),
};
