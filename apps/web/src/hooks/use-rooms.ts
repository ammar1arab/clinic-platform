import {
  roomsService,
  CreateRoomInput,
  UpdateRoomInput,
  Room,
} from '@/services/rooms.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from './create-crud-hooks';

const {
  useList: useRooms,
  useCreate: useCreateRoom,
  useUpdate: useUpdateRoom,
  useRemove: useDeleteRoom,
  useDeactivate: useDeactivateRoom,
  useReactivate: useReactivateRoom,
} = createCrudHooks<Room, CreateRoomInput, UpdateRoomInput>({
  keys: QUERY_KEYS.rooms,
  entity: 'Room',
  labels: {
    removed: 'Room permanently deleted',
  },
  service: roomsService,
});

export {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  useDeactivateRoom,
  useReactivateRoom,
};
