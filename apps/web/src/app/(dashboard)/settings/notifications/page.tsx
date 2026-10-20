'use client';

import { SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import { NotificationPrefs } from '@/components/blocks/settings/notification-prefs';

export default function NotificationsPage() {
  return <div className="w-full min-w-0 space-y-4">
    <SettingsPageBack />
    <NotificationPrefs />
  </div>;
}
