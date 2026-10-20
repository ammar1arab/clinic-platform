'use client';

import { ROLE, notificationCategoriesForRole, type NotificationCategory } from '@clinic/types';
import { ErrorState, SelectionToggle } from '@/components/primitives';
import { Skeleton } from '@/components/ui';
import { useNotificationPrefs, useSaveNotificationPrefs } from '@/hooks/api/use-notification-prefs';
import { useAuth, useLanguage } from '@/providers';

export function NotificationPrefs() {
  const { t } = useLanguage();
  const prefs = useNotificationPrefs();
  const save = useSaveNotificationPrefs();
  const { user } = useAuth();
  const practitioner = user?.role === ROLE.PRACTITIONER;
  const options: Record<NotificationCategory, { label: string; desc: string }> = {
    referrals: { label: t.settings.notifyReferrals, desc: t.settings.notifyReferralsDesc },
    documentation: { label: t.settings.notifyDocumentation, desc: practitioner ? t.settings.notifyDocumentationDesc : t.settings.notifyClinicDocumentationDesc },
    appointments: { label: t.settings.notifyAppointments, desc: t.settings.notifyAppointmentsDesc },
    queue: { label: t.settings.notifyQueue, desc: t.settings.notifyQueueDesc },
    scheduleRequests: { label: practitioner ? t.settings.notifyMyRequests : t.settings.notifyPractitionerRequests, desc: practitioner ? t.settings.notifyMyRequestsDesc : t.settings.notifyPractitionerRequestsDesc },
  };
  const rows = notificationCategoriesForRole(user?.role).map((key) => ({ key, ...options[key] }));
  if (prefs.isError) return <ErrorState onRetry={() => void prefs.refetch()} />;
  if (!prefs.data) return <div className="space-y-2">{rows.map(({ key }) => <Skeleton key={key} className="h-16 w-full rounded-xl" />)}</div>;
  const current = prefs.data;
  return (
    <div className="card-aura divide-y divide-border/70 rounded-xl border bg-card">
      {rows.map((row) => (
        <label key={row.key} className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{row.label}</span>
            <span className="block text-xs text-muted-foreground">{row.desc}</span>
          </span>
          <SelectionToggle label={row.label} checked={current[row.key]} disabled={save.isPending} onChange={(value) => save.mutate({ ...current, [row.key]: value })} />
        </label>
      ))}
    </div>
  );
}
