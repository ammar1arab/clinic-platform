import type { Translations } from '@/i18n';
import {
  roomsService,
  CreateRoomInput,
  UpdateRoomInput,
  Room,
} from '@/services/rooms.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from '../query';

const {
  useList: useRooms,
  useCreate: useCreateRoom,
  useUpdate: useUpdateRoom,
  useRemove: useDeleteRoom,
  useDeactivate: useDeactivateRoom,
  useReactivate: useReactivateRoom,
} = createCrudHooks<Room, CreateRoomInput, UpdateRoomInput>({
  keys: QUERY_KEYS.rooms,
  entity: 'room',
  labels: (t: Translations) => ({ removed: t.common.roomDeleted }),
  service: {
    getAll: roomsService.getAll,
    create: roomsService.create,
    update: roomsService.update,
    remove: roomsService.remove,
    deactivate: roomsService.deactivate,
    reactivate: roomsService.reactivate,
  },
});

export {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  useDeactivateRoom,
  useReactivateRoom,
};
