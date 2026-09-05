'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Role } from '@clinic/types';
import { cn } from '@/lib/utils';
import { canSeeNavHref } from '@/constants/nav-access';
import { ROUTES } from '@/constants/routes';
import { schedulePath } from '@/components/blocks/appointments/schedule/schedule-nav';
import { useKeyboardShortcut } from '@/hooks/shared/use-keyboard-shortcut';
import { useSidebar } from '@/providers/sidebar-provider';
import { IconWell, SoftTip, type IconWellAccent } from '@/components/primitives';
import { ThemeToggle } from '@/components/primitives/display/theme-toggle';
import { LanguageSwitcher } from '@/components/primitives/display/language-switcher';
import { useAuth, useLanguage } from '@/providers';
import {
  IconChevronRight,
  IconClose,
  IconDashboard,
  IconPatients,
  IconPractitioner,
  IconReports,
  IconSchedule,
  IconSettings,
  IconSidebarCollapse,
  type LucideIcon,
} from '@/constants/icons';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: IconWellAccent;
};

function getNavItems(t: { layout: { sidebar: Record<string, string> } }, role?: Role | null): NavItem[] {
  const items: NavItem[] = [
    { label: t.layout.sidebar.dashboard, href: ROUTES.DASHBOARD, icon: IconDashboard, accent: 'default' },
    { label: t.layout.sidebar.schedule, href: schedulePath('month'), icon: IconSchedule, accent: 'teal' },
    { label: t.layout.sidebar.patients, href: ROUTES.PATIENTS, icon: IconPatients, accent: 'success' },
    { label: t.layout.sidebar.practitioners, href: ROUTES.PRACTITIONERS, icon: IconPractitioner, accent: 'default' },
    { label: t.layout.sidebar.reports, href: ROUTES.REPORTS, icon: IconReports, accent: 'warning' },
    { label: t.layout.sidebar.settings, href: ROUTES.SETTINGS, icon: IconSettings, accent: 'muted' },
  ];
  return items.filter((item) => canSeeNavHref(item.href, role));
}

function isActivePath(pathname: string, href: string) {
  if (href.startsWith(ROUTES.SCHEDULE)) {
    return pathname === ROUTES.SCHEDULE || pathname.startsWith(`${ROUTES.SCHEDULE}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
}) {
  const link = (
    <Link
      href={href}
      aria-label={collapsed ? label : undefined}
      className={cn(
        'flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200',
        collapsed ? 'size-10 justify-center px-0' : 'gap-3 px-3 py-2.5',
        active
          ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_color-mix(in_oklch,var(--primary)_65%,transparent)]'
          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-all duration-200',
          collapsed ? 'size-5' : 'size-4',
        )}
      />
      {collapsed ? null : <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );

  if (!collapsed) return <div className="w-full">{link}</div>;

  return (
    <SoftTip label={label} side="right" sideOffset={10} className="flex w-full justify-center">
      {link}
    </SoftTip>
  );
}

function MobileNavLink({
  href,
  label,
  icon,
  accent,
  active,
  open,
  index,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: IconWellAccent;
  active: boolean;
  open: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <div
      style={{ transitionDelay: open ? `${90 + index * 70}ms` : '0ms' }}
      className={cn(
        'transition-all duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:transition-none',
        open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
      )}
    >
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className="card-aura group flex w-full items-center gap-4 rounded-xl bg-card px-4 py-3.5"
      >
        <IconWell icon={icon} size="lg" accent={active ? 'default' : accent} />
        <span
          className={cn(
            'min-w-0 flex-1 text-sm font-semibold tracking-tight',
            !active && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        <IconChevronRight
          className={cn(
            'size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5',
            active ? 'text-brand' : 'text-muted-foreground/70 group-hover:text-foreground',
          )}
        />
      </Link>
    </div>
  );
}

export function SidebarBlock() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navItems = getNavItems(t, user?.role);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const closeMobile = () => setMobileOpen(false);
  useKeyboardShortcut('escape', closeMobile, {
    enabled: mobileOpen,
    ignoreInputs: false,
  });

  return (
    <>
      <div
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label="Navigation"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        data-app-sidebar=""
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-background md:hidden',
          'pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
          'transition-opacity duration-300 ease-out motion-safe:transition-[opacity,transform]',
          mobileOpen
            ? 'pointer-events-auto opacity-100 motion-safe:translate-y-0'
            : 'pointer-events-none opacity-0 motion-safe:translate-y-2',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 px-5 py-3.5',
            'transition-all duration-500 ease-out motion-reduce:transition-none',
            mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-4 w-1 shrink-0 rounded-full bg-linear-to-b from-brand to-accent-teal"
              aria-hidden
            />
            <p className="truncate font-heading text-lg font-semibold tracking-tight text-foreground">
              {t.layout.titles.default}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <SoftTip label={t.layout.sidebar.closeMenu}>
              <button
                type="button"
                aria-label={t.layout.sidebar.closeMenu}
                onClick={closeMobile}
                className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                <IconClose className="size-4" />
              </button>
            </SoftTip>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-y-contain px-4 pt-2">
          <div className="flex flex-col gap-2.5">
            {navItems.map(({ label, href, icon, accent }, index) => (
              <MobileNavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                accent={accent}
                active={isActivePath(pathname, href)}
                open={mobileOpen}
                index={index}
                onClick={closeMobile}
              />
            ))}
          </div>
        </nav>
      </div>

      <aside
        data-app-sidebar=""
        className={cn(
          'hidden flex-col border-e border-border/80 bg-card/95 backdrop-blur-md md:flex',
          'md:static md:shrink-0',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'md:w-18' : 'md:w-56 lg:w-64',
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
              {t.layout.titles.default}
            </p>
          </div>

          <SoftTip label={isCollapsed ? t.layout.sidebar.expand : t.layout.sidebar.collapse} side={isCollapsed ? 'right' : 'bottom'}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? t.layout.sidebar.expand : t.layout.sidebar.collapse}
              className={cn(
                'hidden size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground md:grid',
                isCollapsed && 'rotate-180',
              )}
            >
              <IconSidebarCollapse className="size-4" />
            </button>
          </SoftTip>
        </div>

        <nav
          className={cn(
            'flex flex-1 flex-col gap-1 overflow-y-auto py-3',
            isCollapsed ? 'px-2' : 'px-2.5',
          )}
        >
          {navItems.map(({ label, href, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActivePath(pathname, href)}
              collapsed={isCollapsed}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
