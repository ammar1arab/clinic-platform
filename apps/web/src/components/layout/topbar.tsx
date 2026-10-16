'use client';

import { ROUTES } from '@/constants/routes';
import { useCallback, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth, useLanguage } from '@/providers';
import type { Translations } from '@/i18n';
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
import { IconLogout } from '@/constants/icons';
import { MobileActionsMenu } from '@/components/layout/mobile-actions-menu';
import { MobileMenuToggle } from '@/components/layout/mobile-menu-toggle';

const REFRESH_PARAM = '_cureva_refresh';

function resolveTitle(pathname: string, scheduleView: string | null, t: Translations): string {
  if (pathname === ROUTES.EMAIL_NEW) return t.emails.compose;
  if (pathname === ROUTES.EMAIL_SETTINGS) return t.emails.settings;
  if (pathname === ROUTES.EMAILS) return t.emails.title;
  if (pathname.startsWith(`${ROUTES.EMAILS}/`)) return t.emails.detail;
  if (pathname === ROUTES.HOME_QUEUE) return t.queue.waitingQueue;
  if (pathname === ROUTES.HOME_PROFILE) return t.practitioner.profile;
  if (pathname === ROUTES.PROFILE) return t.common.accountProfile;
  if (pathname === ROUTES.HOME) return t.layout.titles.home;
  if (pathname === ROUTES.DASHBOARD) return t.layout.titles.dashboard;
  if (pathname === ROUTES.SCHEDULE) {
    if (scheduleView === 'doctors') return t.appointments.doctorTimeline;
    if (scheduleView === 'queue') return t.queue.waitingQueue;
    return t.appointments.calendar;
  }
  if (pathname === ROUTES.SCHEDULE_NEW) return t.layout.titles.newAppointment;
  if (pathname === ROUTES.PATIENTS) return t.layout.titles.patients;
  if (pathname === ROUTES.PATIENT_NEW) return t.layout.titles.newPatient;
  if (pathname === ROUTES.PRACTITIONERS) return t.layout.titles.practitioners;
  if (pathname === ROUTES.PRACTITIONERS_NEW) return t.layout.titles.newPractitioner;
  if (pathname === ROUTES.REPORTS) return t.layout.titles.reports;
  if (pathname === ROUTES.SETTINGS) return t.layout.titles.settings;
  if (pathname === ROUTES.SETTINGS_DEPARTMENTS) return t.layout.titles.departments;
  if (pathname === ROUTES.SETTINGS_ROOMS) return t.layout.titles.rooms;
  if (pathname === ROUTES.SETTINGS_SERVICES) return t.layout.titles.services;
  if (pathname === ROUTES.SETTINGS_PAYMENT_METHODS) return t.layout.titles.paymentMethods;
  if (pathname === ROUTES.SETTINGS_PACKAGES) return t.layout.titles.packages;
  if (pathname === ROUTES.SETTINGS_DISCOUNT_CODES) return t.layout.titles.promocodes;
  if (pathname === ROUTES.SETTINGS_CLINIC) return t.common.clinicProfile;

  if (pathname.startsWith(`${ROUTES.PRACTITIONERS}/`) && pathname.endsWith('/edit')) {
    return t.layout.titles.editPractitioner;
  }
  if (pathname.startsWith(`${ROUTES.PRACTITIONERS}/`)) return t.layout.titles.practitioner;
  if (pathname.startsWith(`${ROUTES.SCHEDULE}/`)) return t.layout.titles.appointment;
  if (pathname.startsWith(`${ROUTES.PATIENTS}/`)) return t.layout.titles.patient;
  return t.layout.titles.default;
}

export function TopbarBlock({ showNav = true }: { showNav?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const { setMobileOpen, mobileOpen } = useSidebar();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { t } = useLanguage();
  const title = resolveTitle(pathname, searchParams.get('view'), t);

  const cleanRefreshParam = useCallback((header: HTMLElement | null) => {
    if (!header) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(REFRESH_PARAM)) return;
    url.searchParams.delete(REFRESH_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }, []);

  const handleSignOut = () => {
    logout();
  };

  return (
    <>
      <header
        ref={cleanRefreshParam}
        className="relative z-10 flex h-app-header touch-pan-x touch-pinch-zoom shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-3 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md md:px-5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {showNav ? (
            <SoftTip label={t.layout.sidebar.openMenu}>
              <span className="md:hidden">
                <MobileMenuToggle open={mobileOpen} onClick={() => setMobileOpen(true)} />
              </span>
            </SoftTip>
          ) : null}

          <h1 className="truncate font-heading text-[0.9375rem] font-semibold tracking-tight text-foreground md:text-base">
            {title}
          </h1>
        </div>

        <div className="hidden shrink-0 items-center gap-1 md:flex">
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
        <div className="md:hidden"><MobileActionsMenu /></div>
      </header>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <IconLogout />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.auth.logout}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.auth.logoutConfirmDescription}
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
