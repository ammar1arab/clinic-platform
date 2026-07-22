import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import {
  IconDepartment,
  IconDiscount,
  IconPackage,
  IconPayment,
  IconRoom,
  IconService,
  IconTime,
} from '@/constants/icons';

const settingsLinks = [
  {
    href: ROUTES.SETTINGS_CLINIC,
    title: 'Clinic defaults',
    description: 'Working hours, calendar view, and session defaults',
    icon: IconTime,
  },
  {
    href: ROUTES.SETTINGS_DEPARTMENTS,
    title: 'Departments',
    description: 'Manage clinic specialties and divisions',
    icon: IconDepartment,
  },
  {
    href: ROUTES.SETTINGS_ROOMS,
    title: 'Rooms',
    description: 'Manage physical rooms and assignments',
    icon: IconRoom,
  },
  {
    href: ROUTES.SETTINGS_SERVICES,
    title: 'Services',
    description: 'Manage services, durations, and fees',
    icon: IconService,
  },
  {
    href: ROUTES.SETTINGS_PAYMENT_METHODS,
    title: 'Payment methods',
    description: 'Cash, card, and other ways patients pay',
    icon: IconPayment,
  },
  {
    href: ROUTES.SETTINGS_PACKAGES,
    title: 'Packages',
    description: 'Session bundles and priced packages',
    icon: IconPackage,
  },
  {
    href: ROUTES.SETTINGS_DISCOUNT_CODES,
    title: 'Discount codes',
    description: 'Promo codes for fixed or percentage discounts',
    icon: IconDiscount,
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2.5">
      {settingsLinks.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-border/80 bg-card px-4 py-3.5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-foreground/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className="pointer-events-none absolute inset-y-0 left-0 w-0.5 origin-left scale-y-0 bg-primary transition-transform duration-200 group-hover:scale-y-100"
            aria-hidden
          />
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold tracking-tight">{title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              {description}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}
