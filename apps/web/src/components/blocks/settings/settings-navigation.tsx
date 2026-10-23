'use client';

import type { Role } from '@clinic/types';
import { canSeeNavHref } from '@/constants/nav-access';
import type { ComponentProps, ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';
import {
  IconBadgePercent,
  IconBell,
  IconCalendarClock,
  IconAdd,
  IconHospital,
  IconMail,
  IconNetwork,
  IconPackage,
  IconPayment,
  IconRoom,
  IconService,
} from '@/constants/icons';
import { FormActions, PageBack } from '@/components/primitives';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';
import { useLanguage } from '@/providers';
import type { Translations } from '@/i18n';

const SETTINGS_SECTIONS = {
  clinic: {
    href: ROUTES.SETTINGS_CLINIC,
    icon: IconHospital,
    title: (t: Translations) => t.common.clinicProfile,
    description: (t: Translations) => t.settings.clinicDefaultsDesc,
  },
  departments: {
    href: ROUTES.SETTINGS_DEPARTMENTS,
    icon: IconNetwork,
    title: (t: Translations) => t.settings.departments,
    description: (t: Translations) => t.settings.departmentsDesc,
  },
  rooms: {
    href: ROUTES.SETTINGS_ROOMS,
    icon: IconRoom,
    title: (t: Translations) => t.settings.rooms,
    description: (t: Translations) => t.settings.roomsDesc,
  },
  services: {
    href: ROUTES.SETTINGS_SERVICES,
    icon: IconService,
    title: (t: Translations) => t.settings.services,
    description: (t: Translations) => t.settings.servicesDesc,
  },
  paymentMethods: {
    href: ROUTES.SETTINGS_PAYMENT_METHODS,
    icon: IconPayment,
    title: (t: Translations) => t.settings.paymentMethods,
    description: (t: Translations) => t.settings.paymentMethodsDesc,
  },
  packages: {
    href: ROUTES.SETTINGS_PACKAGES,
    icon: IconPackage,
    title: (t: Translations) => t.settings.packages,
    description: (t: Translations) => t.settings.packagesDesc,
  },
  discountCodes: {
    href: ROUTES.SETTINGS_DISCOUNT_CODES,
    icon: IconBadgePercent,
    title: (t: Translations) => t.settings.promocodes,
    description: (t: Translations) => t.settings.promocodesDesc,
  },
  requests: {
    href: ROUTES.SETTINGS_SCHEDULE_REQUESTS,
    icon: IconCalendarClock,
    title: (t: Translations) => t.scheduleRequests.title,
    description: (t: Translations) => t.scheduleRequests.navigationDescription,
  },
  notifications: {
    href: ROUTES.SETTINGS_NOTIFICATIONS,
    icon: IconBell,
    title: (t: Translations) => t.settings.notifications,
    description: (t: Translations) => t.settings.notificationsDescription,
  },
  email: {
    href: ROUTES.EMAIL_SETTINGS,
    icon: IconMail,
    title: (t: Translations) => t.emails.settings,
    description: (t: Translations) => t.emails.settingsDesc,
  },
} satisfies Record<string, {
  href: string;
  icon: typeof IconHospital;
  title: (t: Translations) => string;
  description: (t: Translations) => string;
}>;

const SECTION_ORDER: (keyof typeof SETTINGS_SECTIONS)[] = [
  'clinic',
  'departments',
  'rooms',
  'services',
  'paymentMethods',
  'packages',
  'discountCodes',
  'email',
  'requests',
  'notifications',
];

export function getSettingsSections(t: Translations, role?: Role) {
  return SECTION_ORDER.filter((key) => canSeeNavHref(SETTINGS_SECTIONS[key].href, role)).map((key) => {
    const section = SETTINGS_SECTIONS[key];
    return {
      key,
      href: section.href,
      icon: section.icon,
      title: section.title(t),
      description: section.description(t),
    };
  });
}

export function SettingsPageBack({
  backHref = ROUTES.SETTINGS,
  search,
  actions,
}: {
  backHref?: string;
  search?: ReactNode;
  actions?: ReactNode;
}) {
  return <PageBack backHref={backHref} search={search} actions={actions} />;
}

export function SettingsAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick} className="shrink-0 max-sm:size-8 max-sm:px-0" aria-label={label}>
      <IconAdd className="size-4 sm:me-1.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function SettingsFormDialog({
  open,
  onOpenChange,
  editing,
  addTitle,
  pending,
  disabled,
  onSubmit,
  onInteractOutside,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  addTitle: string;
  pending: boolean;
  disabled: boolean;
  onSubmit: () => void;
  onInteractOutside?: ComponentProps<typeof DialogContent>['onInteractOutside'];
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={onInteractOutside}>
        <DialogHeader>
          <DialogTitle>{editing ? t.common.edit : addTitle}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          <FormActions
            variant="dialog"
            onCancel={() => onOpenChange(false)}
            submitLabel={editing ? t.common.save : t.common.create}
            pending={pending}
            disabled={disabled}
            onSubmitClick={onSubmit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
