'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import {
  IconWell,
  type IconWellAccent,
} from '@/components/primitives';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDepartment,
  IconDiscount,
  IconPackage,
  IconPayment,
  IconRoom,
  IconService,
  IconTime,
} from '@/constants/icons';
import { useLanguage } from '@/providers';

export default function SettingsPage() {
  const { t, dir } = useLanguage();
  const ChevronIcon = dir === 'rtl' ? IconChevronLeft : IconChevronRight;

  const settingsLinks: {
    href: string;
    title: string;
    description: string;
    icon: typeof IconTime;
    accent: IconWellAccent;
  }[] = [
    {
      href: ROUTES.SETTINGS_CLINIC,
      title: t.settings.clinicDefaults,
      description: t.settings.clinicDefaultsDesc,
      icon: IconTime,
      accent: 'default',
    },
    {
      href: ROUTES.SETTINGS_DEPARTMENTS,
      title: t.settings.departments,
      description: t.settings.departmentsDesc,
      icon: IconDepartment,
      accent: 'teal',
    },
    {
      href: ROUTES.SETTINGS_ROOMS,
      title: t.settings.rooms,
      description: t.settings.roomsDesc,
      icon: IconRoom,
      accent: 'teal',
    },
    {
      href: ROUTES.SETTINGS_SERVICES,
      title: t.settings.services,
      description: t.settings.servicesDesc,
      icon: IconService,
      accent: 'default',
    },
    {
      href: ROUTES.SETTINGS_PAYMENT_METHODS,
      title: t.settings.paymentMethods,
      description: t.settings.paymentMethodsDesc,
      icon: IconPayment,
      accent: 'success',
    },
    {
      href: ROUTES.SETTINGS_PACKAGES,
      title: t.settings.packages,
      description: t.settings.packagesDesc,
      icon: IconPackage,
      accent: 'warning',
    },
    {
      href: ROUTES.SETTINGS_DISCOUNT_CODES,
      title: t.settings.promocodes,
      description: t.settings.promocodesDesc,
      icon: IconDiscount,
      accent: 'warning',
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4">
      <div className="flex flex-col gap-2.5">
        {settingsLinks.map(({ href, title, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="card-aura group flex w-full items-center gap-4 rounded-xl bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
          >
            <IconWell icon={Icon} size="lg" accent={accent} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold tracking-tight">{title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {description}
              </span>
            </span>
            <ChevronIcon className="size-4 shrink-0 text-muted-foreground/70 transition-transform duration-300 group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
