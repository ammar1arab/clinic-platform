'use client';

import { ROUTES } from '@/constants/routes';
import {
  IconBadgePercent,
  IconHospital,
  IconMail,
  IconNetwork,
  IconPackage,
  IconPayment,
  IconRoom,
  IconService,
} from '@/constants/icons';
import type { IconWellAccent } from '@/components/primitives';
import { PageBack } from '@/components/primitives';
import type { Translations } from '@/i18n';

const SETTINGS_SECTIONS = {
  clinic: {
    href: ROUTES.SETTINGS_CLINIC,
    icon: IconHospital,
    accent: 'default',
    title: (t: Translations) => t.common.clinicProfile,
    description: (t: Translations) => t.settings.clinicDefaultsDesc,
  },
  departments: {
    href: ROUTES.SETTINGS_DEPARTMENTS,
    icon: IconNetwork,
    accent: 'violet',
    title: (t: Translations) => t.settings.departments,
    description: (t: Translations) => t.settings.departmentsDesc,
  },
  rooms: {
    href: ROUTES.SETTINGS_ROOMS,
    icon: IconRoom,
    accent: 'cyan',
    title: (t: Translations) => t.settings.rooms,
    description: (t: Translations) => t.settings.roomsDesc,
  },
  services: {
    href: ROUTES.SETTINGS_SERVICES,
    icon: IconService,
    accent: 'teal',
    title: (t: Translations) => t.settings.services,
    description: (t: Translations) => t.settings.servicesDesc,
  },
  paymentMethods: {
    href: ROUTES.SETTINGS_PAYMENT_METHODS,
    icon: IconPayment,
    accent: 'orange',
    title: (t: Translations) => t.settings.paymentMethods,
    description: (t: Translations) => t.settings.paymentMethodsDesc,
  },
  packages: {
    href: ROUTES.SETTINGS_PACKAGES,
    icon: IconPackage,
    accent: 'indigo',
    title: (t: Translations) => t.settings.packages,
    description: (t: Translations) => t.settings.packagesDesc,
  },
  discountCodes: {
    href: ROUTES.SETTINGS_DISCOUNT_CODES,
    icon: IconBadgePercent,
    accent: 'pink',
    title: (t: Translations) => t.settings.promocodes,
    description: (t: Translations) => t.settings.promocodesDesc,
  },
  email: {
    href: ROUTES.EMAIL_SETTINGS,
    icon: IconMail,
    accent: 'success',
    title: (t: Translations) => t.emails.settings,
    description: (t: Translations) => t.emails.settingsDesc,
  },
} satisfies Record<string, {
  href: string;
  icon: typeof IconHospital;
  accent: IconWellAccent;
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
];

export function getSettingsSections(t: Translations) {
  return SECTION_ORDER.map((key) => {
    const section = SETTINGS_SECTIONS[key];
    return {
      key,
      href: section.href,
      icon: section.icon,
      accent: section.accent,
      title: section.title(t),
      description: section.description(t),
    };
  });
}

export function SettingsPageBack({
  backHref = ROUTES.SETTINGS,
}: {
  backHref?: string;
}) {
  return <PageBack backHref={backHref} />;
}
