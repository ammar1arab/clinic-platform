'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ROLE, type AuthMe } from '@clinic/types';
import type { Translations } from '@/i18n';
import { cn } from '@/lib/utils';
import { canSeeNavHref } from '@/constants/nav-access';
import { ROUTES } from '@/constants/routes';
import { schedulePath } from '@/components/blocks/appointments/schedule/schedule-nav';
import { useKeyboardShortcut } from '@/hooks/shared/use-keyboard-shortcut';
import { useSidebar } from '@/providers/sidebar-provider';
import { EntityAvatar, IconWell, SoftTip, type IconWellAccent } from '@/components/primitives';
import { useAuth, useLanguage } from '@/providers';
import { ClinicLockup, ProfileLink } from '@/components/layout/clinic-identity';
import {
  IconChevronRight,
  IconBell,
  IconDashboard,
  IconPatients,
  IconPractitioner,
  IconReports,
  IconMail,
  IconSchedule,
  IconTimer,
  IconService,
  IconNoteTemplate,
  IconSettings,
  IconClinicalRecord,
  IconSidebarCollapse,
  type LucideIcon,
} from '@/constants/icons';

type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  avatar?: { src?: string | null; seed: string };
  accent: IconWellAccent;
};

function getNavItems(t: Translations, user?: Pick<AuthMe, 'role' | 'imageUrl' | 'clinicUserId'> | null): NavItem[] {
  const role = user?.role;
  const profile = {
    label: t.common.accountProfile,
    href: ROUTES.PROFILE,
    avatar: { src: user?.imageUrl, seed: user?.clinicUserId ?? 'profile' },
    accent: 'success' as const,
  };
  if (role === ROLE.PRACTITIONER) {
    return [
      profile,
      { label: t.layout.titles.home, href: ROUTES.HOME, icon: IconDashboard, accent: 'default' },
      { label: t.appointments.calendar, href: schedulePath('month'), icon: IconSchedule, accent: 'violet' },
      { label: t.queue.waitingQueue, href: ROUTES.HOME_QUEUE, icon: IconTimer, accent: 'warning' },
      { label: t.layout.sidebar.visits, href: ROUTES.VISITS, icon: IconClinicalRecord, accent: 'teal' },
      { label: t.layout.sidebar.patients, href: ROUTES.PATIENTS, icon: IconPatients, accent: 'success' },
      { label: t.layout.sidebar.reports, href: ROUTES.REPORTS, icon: IconReports, accent: 'orange' },
      { label: t.notifications.title, href: ROUTES.NOTIFICATIONS, icon: IconBell, accent: 'indigo' },
      { label: t.layout.sidebar.settings, href: ROUTES.SETTINGS, icon: IconSettings, accent: 'cyan' },
    ];
  }
  const items: NavItem[] = [
    profile,
    { label: t.layout.sidebar.dashboard, href: ROUTES.DASHBOARD, icon: IconDashboard, accent: 'default' },
    { label: t.appointments.calendar, href: schedulePath('month'), icon: IconSchedule, accent: 'teal' },
      { label: t.queue.waitingQueue, href: schedulePath('queue'), icon: IconTimer, accent: 'warning' },
      { label: t.appointments.doctorTimeline, href: schedulePath('doctors'), icon: IconService, accent: 'violet' },
      { label: t.layout.sidebar.visits, href: ROUTES.VISITS, icon: IconClinicalRecord, accent: 'teal' },
    { label: t.layout.titles.noteTemplates, href: ROUTES.NOTE_TEMPLATES, icon: IconNoteTemplate, accent: 'indigo' },
    { label: t.layout.sidebar.patients, href: ROUTES.PATIENTS, icon: IconPatients, accent: 'success' },
    { label: t.layout.sidebar.practitioners, href: ROUTES.PRACTITIONERS, icon: IconPractitioner, accent: 'indigo' },
    { label: t.layout.sidebar.reports, href: ROUTES.REPORTS, icon: IconReports, accent: 'orange' },
    { label: t.emails.title, href: ROUTES.EMAILS, icon: IconMail, accent: 'pink' },
    { label: t.notifications.title, href: ROUTES.NOTIFICATIONS, icon: IconBell, accent: 'indigo' },
    { label: t.layout.sidebar.settings, href: ROUTES.SETTINGS, icon: IconSettings, accent: 'cyan' },
  ];
  return items.filter((item) => canSeeNavHref(item.href, role));
}

function isActivePath(pathname: string, href: string, scheduleView: string | null) {
  if (href.startsWith(ROUTES.SCHEDULE)) {
    if (pathname !== ROUTES.SCHEDULE && !pathname.startsWith(`${ROUTES.SCHEDULE}/`)) return false;
    const targetView = new URLSearchParams(href.split('?')[1]).get('view');
    const currentView = scheduleView ?? 'month';
    if (targetView === 'month') return ['month', 'week', 'day'].includes(currentView);
    return targetView === currentView;
  }
  if (href === ROUTES.HOME) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  avatar,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  avatar?: { src?: string | null; seed: string };
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
      {avatar ? (
        <EntityAvatar priority src={avatar.src} seed={avatar.seed} size={collapsed ? 'default' : 'sm'} className="bg-transparent ring-0" />
      ) : Icon ? (
        <Icon className={cn('shrink-0', collapsed ? 'size-5' : 'size-4')} />
      ) : null}
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

function SideMenuLink({
  href,
  label,
  icon,
  avatar,
  accent,
  active,
  open,
  index,
  onClick,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  avatar?: { src?: string | null; seed: string };
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
        className="card-aura group flex w-full items-center gap-4 rounded-xl border-0 bg-card px-4 py-3.5 transition-colors duration-200 md:border md:hover:border-primary/40"
      >
        {avatar ? (
          <EntityAvatar priority src={avatar.src} seed={avatar.seed} size="lg" className="bg-transparent ring-0" />
        ) : icon ? (
          <IconWell icon={icon} size="lg" accent={accent} />
        ) : null}
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
            'size-4 shrink-0 transition-transform duration-300 rtl:-scale-x-100 ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5',
            active ? 'text-brand' : 'text-muted-foreground/70 group-hover:text-foreground',
          )}
        />
      </Link>
    </div>
  );
}

export function SidebarBlock() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scheduleView = searchParams.get('view');
  const { isCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navItems = getNavItems(t, user);

  const closeMobile = () => setMobileOpen(false);
  useKeyboardShortcut('escape', closeMobile, {
    enabled: mobileOpen,
    ignoreInputs: false,
  });

  return (
    <>
      <div
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? false : undefined}
        aria-label={t.layout.sideMenu.menu}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        id="mobile-side-menu"
        data-app-side-menu=""
        className={cn(
          'fixed inset-x-0 bottom-0 top-[var(--app-header-height)] z-20 flex flex-col border-t border-border/80 bg-background md:hidden',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
          'transition-opacity duration-300 ease-out motion-safe:transition-[opacity,transform]',
          mobileOpen
            ? 'pointer-events-auto opacity-100 motion-safe:translate-y-0'
            : 'pointer-events-none opacity-0 motion-safe:translate-y-2',
        )}
      >
        <nav className="flex-1 overflow-y-auto overscroll-y-contain px-4 pt-3">
          <div className="flex flex-col gap-2.5">
            {navItems.map(({ label, href, icon, avatar, accent }, index) => (
              <SideMenuLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                avatar={avatar}
                accent={accent}
                active={isActivePath(pathname, href, scheduleView)}
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
          '[[data-sidebar=collapsed]_&]:md:w-18 [[data-sidebar=collapsed]_&]:lg:w-18',
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-border/70 transition-all duration-300',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {isCollapsed ? (
            <SoftTip label={t.layout.sidebar.expand} side="right">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={t.layout.sidebar.expand}
                className="rounded-lg"
              >
                <ClinicLockup />
              </button>
            </SoftTip>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <ClinicLockup />
              </div>
              <SoftTip label={t.layout.sidebar.collapse} side="bottom">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={t.layout.sidebar.collapse}
                  className="hidden size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground md:grid"
                >
                  <IconSidebarCollapse className="size-4" />
                </button>
              </SoftTip>
            </>
          )}
        </div>

        <nav
          className={cn(
            'flex flex-1 flex-col gap-1 overflow-y-auto py-3',
            isCollapsed ? 'px-2' : 'px-2.5',
          )}
        >
          {navItems.filter(({ href }) => href !== ROUTES.PROFILE).map(({ label, href, icon, avatar }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              avatar={avatar}
              active={isActivePath(pathname, href, scheduleView)}
              collapsed={isCollapsed}
            />
          ))}
        </nav>
        <ProfileLink collapsed={isCollapsed} />
      </aside>
    </>
  );
}
