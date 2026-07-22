'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { useSidebar } from '@/providers/sidebar-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  const { logout, user } = useAuth();
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const title = resolveTitle(pathname);
  const initials = (user?.name ?? 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur-sm md:h-13 md:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          aria-label="Open menu"
          className="grid size-8 shrink-0 place-items-center rounded-md border bg-background hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-4" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span
            className="hidden h-3.5 w-0.5 shrink-0 rounded-full bg-primary sm:block"
            aria-hidden
          />
          <h1 className="truncate font-heading text-sm font-semibold tracking-tight text-foreground md:text-[0.9375rem]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none" aria-label="Account menu">
              <Avatar className="size-7 cursor-pointer md:size-8">
                <AvatarFallback className="bg-primary text-[10px] text-primary-foreground md:text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push(ROUTES.LOGIN);
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
