'use client';

import { AccountPasswordReset } from '@/components/blocks/auth/account-password-reset';
import { ROLE } from '@clinic/types';
import { NotePreference } from '@/components/blocks/visits/note-preference';
import { IconCard, ProfileSection } from '@/components/primitives';
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
        {user?.role === ROLE.PRACTITIONER ? (
          <ProfileSection title={t.visits.preference}>
            <NotePreference />
          </ProfileSection>
        ) : null}
        {settingsLinks.map(({ key, href, title, description, icon: Icon, accent }) => (
          <IconCard
            key={key}
            href={href}
            title={title}
            description={description}
            icon={Icon}
            accent={accent}
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
