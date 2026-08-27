'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
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
import { ThemeToggle } from './theme-toggle';
import { SoftTip } from '@/components/primitives';
import { IconLogout, IconMenu } from '@/constants/icons';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/schedule': 'Schedule',
  '/schedule/new': 'New Appointment',
  '/patients': 'Patients',
  '/patients/new': 'New Patient',
  '/practitioners': 'Practitioners',
  '/practitioners/new': 'New practitioner',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/settings/departments': 'Departments',
  '/settings/rooms': 'Rooms',
  '/settings/services': 'Services',
  '/settings/payment-methods': 'Payment methods',
  '/settings/packages': 'Packages',
  '/settings/discount-codes': 'Promocodes',
  '/settings/clinic': 'Clinic defaults',
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/practitioners/') && pathname.endsWith('/edit')) {
    return 'Edit practitioner';
  }
  if (pathname.startsWith('/practitioners/')) return 'Practitioner';
  if (pathname.startsWith('/schedule/')) return 'Appointment';
  if (pathname.startsWith('/patients/')) return 'Patient';
  return 'Clinic Platform';
}

export function TopbarBlock() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const title = resolveTitle(pathname);

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
          <SoftTip label="Open menu">
            <button
              aria-label="Open menu"
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
          <ThemeToggle />
          <SoftTip label="Sign out">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
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
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ll need to sign in again to access the clinic dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleSignOut}>
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
