import type { NotificationPrefs } from '@clinic/types';
import { QUERY_KEYS } from '@/constants/query-keys';
import { notificationPrefsService } from '@/services/notification-prefs.service';
import { useLanguage } from '@/providers';
import { useApiMutation, useFetchData } from '../query';

export function useNotificationPrefs() {
  return useFetchData<NotificationPrefs>({
    queryKey: QUERY_KEYS.notificationPrefs,
    request: () => notificationPrefsService.get(),
  });
}

export function useSaveNotificationPrefs() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (prefs: NotificationPrefs) => notificationPrefsService.save(prefs),
    invalidateQueries: [QUERY_KEYS.notificationPrefs],
    successMessage: t.settings.notificationsSaved,
  });
}
