'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { useSidebar } from '@/providers/sidebar-provider';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/blocks/layout/theme-toggle';
import { LogOut, Menu } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/schedule': 'Schedule',
  '/schedule/new': 'New Appointment',
  '/patients': 'Patients',
  '/patients/new': 'New Patient',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/settings/departments': 'Departments',
  '/settings/rooms': 'Rooms',
  '/settings/services': 'Services',
  '/settings/payment-methods': 'Payment methods',
  '/settings/packages': 'Packages',
  '/settings/discount-codes': 'Discount codes',
  '/settings/clinic': 'Clinic defaults',
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
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
      <header className="relative z-10 flex h-13 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-3 shadow-[0_1px_0_0_color-mix(in_oklch,var(--brand)_12%,transparent)] backdrop-blur-md md:h-14 md:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            aria-label="Open menu"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/80 bg-card/80 text-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </button>

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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setSignOutOpen(true)}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <LogOut />
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
