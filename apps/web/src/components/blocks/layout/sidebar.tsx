'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { useSidebar } from '@/providers/sidebar-provider';
import { useAuth } from '@/providers';
import { X, PanelLeftClose } from 'lucide-react';
import {
  IconDashboard,
  IconSchedule,
  IconPatients,
  IconReports,
  IconSettings,
} from '@/constants/icons';

const navItems = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: IconDashboard },
  { label: 'Schedule', href: ROUTES.SCHEDULE, icon: IconSchedule },
  { label: 'Patients', href: ROUTES.PATIENTS, icon: IconPatients },
  { label: 'Reports', href: ROUTES.REPORTS, icon: IconReports },
  { label: 'Settings', href: ROUTES.SETTINGS, icon: IconSettings },
];

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/80 bg-card/95 backdrop-blur-md',
          'transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:flex-shrink-0',
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
              isCollapsed && 'opacity-0 w-0 overflow-hidden',
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
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground md:grid',
              isCollapsed && 'rotate-180',
            )}
          >
            <PanelLeftClose className="size-4" />
          </button>

          <button
            aria-label="Close menu"
            className="grid size-7 place-items-center rounded-md hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className={cn('flex-1 space-y-1 overflow-y-auto py-3', isCollapsed ? 'px-2' : 'px-2.5')}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group/tooltip relative flex items-center rounded-xl text-sm transition-all duration-200',
                  isCollapsed ? 'mx-auto size-10 justify-center' : 'w-full gap-3 px-3 py-2.5',
                  active
                    ? 'bg-primary text-primary-foreground font-medium shadow-[0_8px_20px_-10px_color-mix(in_oklch,var(--primary)_65%,transparent)]'
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

                {isCollapsed && (
                  <div className="pointer-events-none absolute top-1/2 left-14 z-50 -translate-y-1/2 scale-95 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-all duration-150 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100">
                    {label}
                  </div>
                )}
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
