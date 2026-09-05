import type { Role } from '@clinic/types';
import { ROUTES } from './routes';

const STAFF: Role[] = ['owner', 'admin'];
const CLINIC: Role[] = ['owner', 'admin', 'practitioner'];
const FINANCE: Role[] = ['owner', 'admin', 'financial'];

/** Routes a role may open. `undefined` roles = all authenticated roles. */
export const NAV_ACCESS: { prefix: string; roles?: Role[] }[] = [
  { prefix: ROUTES.DASHBOARD },
  { prefix: ROUTES.SCHEDULE },
  { prefix: ROUTES.PATIENTS, roles: CLINIC },
  { prefix: ROUTES.PRACTITIONERS, roles: STAFF },
  { prefix: ROUTES.REPORTS, roles: FINANCE },
  { prefix: ROUTES.SETTINGS, roles: STAFF },
];

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
