import type { Role } from '@clinic/types';
import { ROUTES } from './routes';

const STAFF: Role[] = ['owner', 'admin'];
const FINANCE: Role[] = ['owner', 'admin', 'financial'];
const OPS: Role[] = ['owner', 'admin', 'financial'];
const PRACTITIONER: Role[] = ['practitioner'];

const SIDEBAR_PREFIXES = [
  ROUTES.DASHBOARD,
  ROUTES.SCHEDULE,
  ROUTES.PATIENTS,
  ROUTES.PRACTITIONERS,
  ROUTES.REPORTS,
  ROUTES.SETTINGS,
] as const;

/** Routes a role may open. `undefined` roles = all authenticated roles. */
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
  if (role === 'practitioner') return ROUTES.HOME;
  if (role === 'financial') return ROUTES.REPORTS;
  return ROUTES.DASHBOARD;
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
