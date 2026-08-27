'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { schedulePath } from '@/components/blocks/appointments/schedule-nav';
import { useSidebar } from '@/providers/sidebar-provider';
import { useAuth } from '@/providers';
import { PanelLeftClose, X } from 'lucide-react';
import {
  IconDashboard,
  IconPatients,
  IconPractitioner,
  IconReports,
  IconSchedule,
  IconSettings,
} from '@/constants/icons';

const navItems = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: IconDashboard },
  { label: 'Schedule', href: schedulePath('month'), icon: IconSchedule },
  { label: 'Patients', href: ROUTES.PATIENTS, icon: IconPatients },
  { label: 'Practitioners', href: ROUTES.PRACTITIONERS, icon: IconPractitioner },
  { label: 'Reports', href: ROUTES.REPORTS, icon: IconReports },
  { label: 'Settings', href: ROUTES.SETTINGS, icon: IconSettings },
];

function isActivePath(pathname: string, href: string) {
  if (href.startsWith(ROUTES.SCHEDULE)) {
    return pathname === ROUTES.SCHEDULE || pathname.startsWith(`${ROUTES.SCHEDULE}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarBlock() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const initials = (user?.name ?? 'CO')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-brand/15 via-accent-teal/10 to-transparent" />

          <div className="relative flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-linear-to-br from-brand to-accent-teal text-sm font-bold text-white shadow-md">
                C
              </span>
              <div>
                <p className="font-heading text-lg font-semibold tracking-tight">Cureva</p>
                <p className="text-xs text-muted-foreground">Clinic workspace</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMobile}
              className="grid size-11 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative mx-5 mt-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-accent-teal text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user?.name ?? 'User'}</p>
                <p className="truncate text-sm capitalize text-muted-foreground">
                  {user?.role ?? 'Staff'}
                </p>
              </div>
            </div>
          </div>

          <nav className="relative flex-1 overflow-y-auto px-5 py-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Navigate
            </p>
            <div className="grid grid-cols-2 gap-3">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className={cn(
                      'flex min-h-28 flex-col justify-between rounded-2xl border p-4 transition-all',
                      active
                        ? 'border-primary/40 bg-primary text-primary-foreground shadow-[0_16px_40px_-24px_color-mix(in_oklch,var(--primary)_80%,transparent)]'
                        : 'border-border/80 bg-card text-foreground hover:border-primary/30 hover:bg-accent/40',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-10 place-items-center rounded-xl',
                        active ? 'bg-white/15' : 'bg-muted',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="relative border-t border-border/70 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-center text-xs text-muted-foreground">
              Tap a destination to continue
            </p>
          </div>
        </div>
      ) : null}

      <aside
        className={cn(
          'hidden flex-col border-r border-border/80 bg-card/95 backdrop-blur-md md:flex',
          'md:static md:flex-shrink-0',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'md:w-[72px]' : 'md:w-56 lg:w-64',
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-border/70 transition-all duration-300',
            isCollapsed ? 'justify-center px-0' : 'justify-between px-4',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 items-center gap-2.5 transition-all duration-200',
              isCollapsed && 'w-0 overflow-hidden opacity-0',
            )}
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-linear-to-br from-brand to-accent-teal text-[10px] font-bold text-white shadow-sm"
              aria-hidden
            >
              C
            </span>
            <span className="truncate font-heading text-sm font-semibold tracking-tight">
              Cureva
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground md:grid',
              isCollapsed && 'rotate-180',
            )}
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <nav className={cn('flex-1 space-y-1 overflow-y-auto py-3', isCollapsed ? 'px-2' : 'px-2.5')}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group/tooltip relative flex items-center rounded-xl text-sm transition-all duration-200',
                  isCollapsed ? 'mx-auto size-10 justify-center' : 'w-full gap-3 px-3 py-2.5',
                  active
                    ? 'bg-primary font-medium text-primary-foreground shadow-[0_8px_20px_-10px_color-mix(in_oklch,var(--primary)_65%,transparent)]'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-all duration-200',
                    isCollapsed ? 'size-5' : 'size-4',
                  )}
                />
                <span
                  className={cn(
                    'whitespace-nowrap transition-all duration-300 ease-in-out',
                    isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100',
                  )}
                >
                  {label}
                </span>

                {isCollapsed ? (
                  <div className="pointer-events-none absolute top-1/2 left-14 z-50 -translate-y-1/2 scale-95 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-all duration-150 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100">
                    {label}
                  </div>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 justify-center border-t border-border/70 p-3 transition-all duration-200">
          {isCollapsed ? (
            <div
              className="grid size-8 cursor-default place-items-center rounded-full bg-linear-to-br from-brand/20 to-accent-teal/20 text-xs font-bold text-primary"
              title={user?.name ?? 'User'}
            >
              {initials}
            </div>
          ) : (
            <div className="flex w-full items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-accent-teal text-[10px] font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{user?.name ?? 'User'}</p>
                <p className="truncate text-[11px] capitalize text-muted-foreground">
                  {user?.role ?? 'Staff'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
