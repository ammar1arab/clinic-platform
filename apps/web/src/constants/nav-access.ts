import { ROLE, type Role } from '@clinic/types';
import { ROUTES } from './routes';

const STAFF: Role[] = [ROLE.OWNER, ROLE.ADMIN];
const FINANCE: Role[] = [ROLE.OWNER, ROLE.ADMIN, ROLE.FINANCIAL];
const OPS: Role[] = [ROLE.OWNER, ROLE.ADMIN, ROLE.FINANCIAL];
const PRACTITIONER: Role[] = [ROLE.PRACTITIONER];

const SIDEBAR_PREFIXES = [
  ROUTES.HOME,
  ROUTES.DASHBOARD,
  ROUTES.SCHEDULE,
  ROUTES.PATIENTS,
  ROUTES.PRACTITIONERS,
  ROUTES.REPORTS,
  ROUTES.SETTINGS,
] as const;

export const NAV_ACCESS: { prefix: string; roles?: Role[] }[] = [
  { prefix: ROUTES.HOME, roles: PRACTITIONER },
  { prefix: ROUTES.DASHBOARD, roles: OPS },
  { prefix: ROUTES.SCHEDULE, roles: STAFF },
  { prefix: ROUTES.PATIENTS, roles: STAFF },
  { prefix: ROUTES.PRACTITIONERS, roles: STAFF },
  { prefix: ROUTES.REPORTS, roles: FINANCE },
  { prefix: ROUTES.SETTINGS, roles: STAFF },
];

export function homePathForRole(role?: Role | null): string {
  if (role === ROLE.PRACTITIONER) return ROUTES.HOME;
  if (role === ROLE.FINANCIAL) return ROUTES.REPORTS;
  return ROUTES.DASHBOARD;
}

export function postLoginPath(role?: Role | null, from?: string | null): string {
  const home = homePathForRole(role);
  if (!from || !from.startsWith('/') || from.startsWith('//') || from === ROUTES.LOGIN) {
    return home;
  }
  const path = from.split('?')[0] ?? from;
  return canAccessPath(path, role) ? from : home;
}

export function canAccessPath(pathname: string, role?: Role | null): boolean {
  if (!role) return false;
  const rule = NAV_ACCESS.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );
  if (!rule) return true;
  return !rule.roles || rule.roles.includes(role);
}

export function canSeeNavHref(href: string, role?: Role | null): boolean {
  const path = href.split('?')[0] ?? href;
  return canAccessPath(path, role);
}

export function hasClinicNav(role?: Role | null): boolean {
  return SIDEBAR_PREFIXES.some((prefix) => canSeeNavHref(prefix, role));
}
