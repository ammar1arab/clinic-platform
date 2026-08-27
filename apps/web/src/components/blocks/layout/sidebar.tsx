'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { schedulePath } from '@/components/blocks/appointments/schedule-nav';
import { useSidebar } from '@/providers/sidebar-provider';
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
  const { isCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobile}
          className={cn(
            'absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ease-out',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />

        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-card shadow-xl',
            'transition-transform duration-300 ease-out',
            'pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
            <p className="font-heading text-base font-semibold tracking-tight text-foreground">
              Cureva clinic
            </p>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMobile}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map(({ label, href, icon: Icon }, index) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  style={{ transitionDelay: mobileOpen ? `${40 + index * 28}ms` : '0ms' }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium',
                    'transition-all duration-300 ease-out',
                    mobileOpen
                      ? 'translate-x-0 opacity-100'
                      : '-translate-x-2 opacity-0',
                    active
                      ? 'bg-primary text-primary-foreground shadow-[0_10px_28px_-16px_color-mix(in_oklch,var(--primary)_70%,transparent)]'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

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
              'min-w-0 transition-all duration-200',
              isCollapsed && 'w-0 overflow-hidden opacity-0',
            )}
          >
            <p className="truncate font-heading text-sm font-semibold tracking-tight">
              Cureva clinic
            </p>
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
      </aside>
    </>
  );
}
