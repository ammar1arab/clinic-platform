import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/lib/api';
import type { NotificationDTO } from '@clinic/types';

export const notificationsService = {
  list: () => api.get<NotificationDTO[]>(ENDPOINTS.NOTIFICATIONS.BASE).then((r) => r.data),
  markRead: (id: string) => api.patch<NotificationDTO>(ENDPOINTS.NOTIFICATIONS.READ(id)).then((r) => r.data),
  markAllRead: () => api.patch<NotificationDTO[]>(ENDPOINTS.NOTIFICATIONS.READ_ALL).then((r) => r.data),
  clear: () => api.delete<NotificationDTO[]>(ENDPOINTS.NOTIFICATIONS.BASE).then((r) => r.data),
};
