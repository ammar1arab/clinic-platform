import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/lib/api';
import type { NotificationPrefs } from '@clinic/types';

export const notificationPrefsService = {
  get: () => api.get<NotificationPrefs>(ENDPOINTS.NOTIFICATIONS.PREFERENCES).then((r) => r.data),
  save: (prefs: NotificationPrefs) => api.put<NotificationPrefs>(ENDPOINTS.NOTIFICATIONS.PREFERENCES, prefs).then((r) => r.data),
};
