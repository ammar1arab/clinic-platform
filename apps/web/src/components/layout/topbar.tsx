'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { useSidebar } from '@/providers/sidebar-provider';
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui';
import { ThemeToggle } from '@/components/primitives/display/theme-toggle';
import { LanguageSwitcher } from '@/components/primitives/display/language-switcher';
import { SoftTip } from '@/components/primitives';
import { IconLogout, IconMenu } from '@/constants/icons';

function resolveTitle(pathname: string, t: any): string {
  if (pathname === '/dashboard') return t.layout.titles.dashboard;
  if (pathname === '/schedule') return t.layout.titles.schedule;
  if (pathname === '/schedule/new') return t.layout.titles.newAppointment;
  if (pathname === '/patients') return t.layout.titles.patients;
  if (pathname === '/patients/new') return t.layout.titles.newPatient;
  if (pathname === '/practitioners') return t.layout.titles.practitioners;
  if (pathname === '/practitioners/new') return t.layout.titles.newPractitioner;
  if (pathname === '/reports') return t.layout.titles.reports;
  if (pathname === '/settings') return t.layout.titles.settings;
  if (pathname === '/settings/departments') return t.layout.titles.departments;
  if (pathname === '/settings/rooms') return t.layout.titles.rooms;
  if (pathname === '/settings/services') return t.layout.titles.services;
  if (pathname === '/settings/payment-methods') return t.layout.titles.paymentMethods;
  if (pathname === '/settings/packages') return t.layout.titles.packages;
  if (pathname === '/settings/discount-codes') return t.layout.titles.promocodes;
  if (pathname === '/settings/clinic') return t.layout.titles.clinicDefaults;

  if (pathname.startsWith('/practitioners/') && pathname.endsWith('/edit')) {
    return t.layout.titles.editPractitioner;
  }
  if (pathname.startsWith('/practitioners/')) return t.layout.titles.practitioner;
  if (pathname.startsWith('/schedule/')) return t.layout.titles.appointment;
  if (pathname.startsWith('/patients/')) return t.layout.titles.patient;
  return t.layout.titles.default;
}

export function TopbarBlock() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { t } = useLanguage();
  const title = resolveTitle(pathname, t);

  const handleSignOut = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <>
      <header
        data-app-topbar=""
        className="relative z-10 flex h-app-header shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-3 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_0_color-mix(in_oklch,var(--brand)_12%,transparent)] backdrop-blur-md md:px-5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <SoftTip label={t.layout.sidebar.openMenu}>
            <button
              aria-label={t.layout.sidebar.openMenu}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/80 bg-card/80 text-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu className="size-4" />
            </button>
          </SoftTip>

          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="hidden h-4 w-1 shrink-0 rounded-full bg-linear-to-b from-brand to-accent-teal sm:block"
              aria-hidden
            />
            <h1 className="truncate font-heading text-[0.9375rem] font-semibold tracking-tight text-foreground md:text-base">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <SoftTip label={t.auth.logout}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t.auth.logout}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setSignOutOpen(true)}
            >
              <IconLogout className="size-4" />
            </Button>
          </SoftTip>
        </div>
      </header>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <IconLogout />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.auth.logout}?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ll need to sign in again to access the clinic dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleSignOut}>
              {t.auth.logout}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
