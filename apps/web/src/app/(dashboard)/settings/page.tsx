import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import {
  IconWell,
  type IconWellAccent,
} from '@/components/primitives';
import { IconChevronRight, IconDepartment, IconDiscount, IconPackage, IconPayment, IconRoom, IconService, IconTime } from '@/constants/icons';

const settingsLinks: {
  href: string;
  title: string;
  description: string;
  icon: typeof IconTime;
  accent: IconWellAccent;
}[] = [
  {
    href: ROUTES.SETTINGS_CLINIC,
    title: 'Clinic defaults',
    description: 'Working hours, calendar view, and session defaults',
    icon: IconTime,
    accent: 'default',
  },
  {
    href: ROUTES.SETTINGS_DEPARTMENTS,
    title: 'Departments',
    description: 'Manage clinic specialties and divisions',
    icon: IconDepartment,
    accent: 'teal',
  },
  {
    href: ROUTES.SETTINGS_ROOMS,
    title: 'Rooms',
    description: 'Manage physical rooms and assignments',
    icon: IconRoom,
    accent: 'teal',
  },
  {
    href: ROUTES.SETTINGS_SERVICES,
    title: 'Services',
    description: 'Manage services, durations, and fees',
    icon: IconService,
    accent: 'default',
  },
  {
    href: ROUTES.SETTINGS_PAYMENT_METHODS,
    title: 'Payment methods',
    description: 'Cash, card, and other ways patients pay',
    icon: IconPayment,
    accent: 'success',
  },
  {
    href: ROUTES.SETTINGS_PACKAGES,
    title: 'Packages',
    description: 'Session bundles and priced packages',
    icon: IconPackage,
    accent: 'warning',
  },
  {
    href: ROUTES.SETTINGS_DISCOUNT_CODES,
    title: 'Promocodes',
    description: 'Promocodes for fixed or percentage discounts',
    icon: IconDiscount,
    accent: 'warning',
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2.5">
      {settingsLinks.map(({ href, title, description, icon: Icon, accent }) => (
        <Link
          key={href}
          href={href}
          className="card-aura group flex w-full items-center gap-4 rounded-xl bg-card px-4 py-3.5"
        >
          <IconWell icon={Icon} size="lg" accent={accent} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold tracking-tight">{title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              {description}
            </span>
          </span>
          <IconChevronRight className="size-4 shrink-0 text-muted-foreground/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}
