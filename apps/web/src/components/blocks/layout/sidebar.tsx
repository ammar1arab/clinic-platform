'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { useSidebar } from '@/providers/sidebar-provider';
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
  const { isCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();

  // Close drawer on route change (mobile only)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r',
          'transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:flex-shrink-0',
          isCollapsed ? 'md:w-[72px]' : 'md:w-56 lg:w-64'
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            'h-14 flex items-center border-b flex-shrink-0 transition-all duration-300',
            isCollapsed ? 'justify-center px-0' : 'justify-between px-4'
          )}
        >
          <span
            className={cn(
              'font-semibold text-sm tracking-tight transition-all duration-200 whitespace-nowrap',
              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            Clinic Platform
          </span>

          {/* Desktop Toggle Button (Gemini-style) */}
          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden md:grid size-8 place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200',
              isCollapsed && 'rotate-180'
            )}
          >
            <PanelLeftClose className="size-4" />
          </button>

          {/* Mobile Close Button */}
          <button
            aria-label="Close menu"
            className="md:hidden grid size-7 place-items-center rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={cn('flex-1 py-3 space-y-1 overflow-y-auto', isCollapsed ? 'px-2' : 'px-2')}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center rounded-md text-sm transition-all duration-200 relative group/tooltip',
                  isCollapsed
                    ? 'justify-center size-10 mx-auto'
                    : 'gap-3 px-3 py-2 w-full',
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className={cn('flex-shrink-0 transition-all duration-200', isCollapsed ? 'size-5' : 'size-4')} />

                <span
                  className={cn(
                    'transition-all duration-300 ease-in-out whitespace-nowrap',
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  )}
                >
                  {label}
                </span>

                {/* Highly Stable CSS Tooltip for Collapsed State */}
                {isCollapsed && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 text-xs font-medium text-popover-foreground bg-popover border rounded-md opacity-0 scale-95 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-150 whitespace-nowrap shadow-md">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t flex-shrink-0 flex justify-center transition-all duration-200">
          {isCollapsed ? (
            <div
              className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs cursor-default"
              title="Clinic Owner"
            >
              CO
            </div>
          ) : (
            <div className="w-full">
              <p className="text-xs text-muted-foreground px-3 font-medium transition-opacity duration-200">
                Clinic Owner
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}