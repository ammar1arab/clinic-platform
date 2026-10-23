'use client';

import { AccountPasswordReset } from '@/components/blocks/auth/account-password-reset';
import { IconCard } from '@/components/primitives';
import { IconChevronLeft, IconChevronRight } from '@/constants/icons';
import { getSettingsSections } from '@/components/blocks/settings/settings-navigation';
import { useAuth, useLanguage } from '@/providers';

export default function SettingsPage() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const ChevronIcon = dir === 'rtl' ? IconChevronLeft : IconChevronRight;

  const settingsLinks = getSettingsSections(t, user?.role);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-col gap-2.5">
        {settingsLinks.map(({ key, href, title, description, icon: Icon }) => (
          <IconCard
            key={key}
            href={href}
            title={title}
            description={description}
            icon={Icon}
            endContent={
              <ChevronIcon className="size-4 text-muted-foreground/70 transition-transform duration-300 group-hover:text-foreground" />
            }
          />
        ))}
        <AccountPasswordReset />
      </div>
    </div>
  );
}
