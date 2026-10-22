import { useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationDTO } from '@clinic/types';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getSocket } from '@/lib/socket';
import { playNotificationSound, prepareFeedbackSound } from '@/lib/feedback-sound';
import { notificationsService } from '@/services/notifications.service';
import { useAuth } from '@/providers';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useApiMutation, useFetchData } from '../query';

function useNotificationRealtime(clinicId: string, userId: string) {
  const queryClient = useQueryClient();
  const subscribe = useMemo(
    () => () => {
      if (!clinicId || !userId) return () => {};
      const socket = getSocket();
      if (!socket.connected) socket.connect();
      const refresh = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      const join = () => {
        socket.emit('join-clinic', clinicId);
        refresh();
      };
      const created = (event: { userId: string }) => {
        if (event.userId !== userId) return;
        playNotificationSound();
        refresh();
      };
      if (socket.connected) join();
      socket.on('connect', join);
      socket.on('notification-created', created);
      document.addEventListener('pointerdown', prepareFeedbackSound, { capture: true, once: true });
      return () => {
        socket.off('connect', join);
        socket.off('notification-created', created);
        document.removeEventListener('pointerdown', prepareFeedbackSound, { capture: true });
      };
    },
    [clinicId, userId, queryClient],
  );
  useSyncExternalStore(subscribe, () => 0, () => 0);
}

export function useNotifications({ realtime = true }: { realtime?: boolean } = {}) {
  const { user } = useAuth();
  const clinicId = useClinicId();
  const queryClient = useQueryClient();
  useNotificationRealtime(realtime ? clinicId : '', user?.clinicUserId ?? '');

  const query = useFetchData<NotificationDTO[]>({
    queryKey: QUERY_KEYS.notifications,
    request: () => notificationsService.list(),
  });

  const patch = (change: (list: NotificationDTO[]) => NotificationDTO[]) =>
    queryClient.setQueryData<NotificationDTO[]>(QUERY_KEYS.notifications, (list) => list && change(list));

  const markRead = useApiMutation({
    request: (id: string) => notificationsService.markRead(id),
    onMutate: (id) => {
      patch((list) => list.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)));
    },
    invalidateQueries: [QUERY_KEYS.notifications],
  });
  const markAllRead = useApiMutation({
    request: () => notificationsService.markAllRead(),
    onMutate: () => {
      const readAt = new Date().toISOString();
      patch((list) => list.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    },
    invalidateQueries: [QUERY_KEYS.notifications],
  });
  const clear = useApiMutation({
    request: () => notificationsService.clear(),
    onMutate: () => {
      patch(() => []);
    },
    invalidateQueries: [QUERY_KEYS.notifications],
  });

  const items = query.data;
  const unread = useMemo(() => items?.filter((item) => !item.readAt).length ?? 0, [items]);
  return { query, items, unread, markRead, markAllRead, clear };
}
