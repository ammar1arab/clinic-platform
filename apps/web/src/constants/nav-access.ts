import { ROLE, type Role } from '@clinic/types';
import { ROUTES } from './routes';

const STAFF: Role[] = [ROLE.OWNER, ROLE.ADMIN];
const FINANCE: Role[] = [ROLE.OWNER, ROLE.ADMIN, ROLE.FINANCIAL];
const REPORTS: Role[] = [...FINANCE, ROLE.PRACTITIONER];
const VISITS: Role[] = [ROLE.OWNER, ROLE.ADMIN, ROLE.PRACTITIONER, ROLE.FINANCIAL];
const OPS: Role[] = [ROLE.OWNER, ROLE.ADMIN, ROLE.FINANCIAL];
const PRACTITIONER: Role[] = [ROLE.PRACTITIONER];

const SIDEBAR_PREFIXES = [
  ROUTES.EMAILS,
  ROUTES.HOME,
  ROUTES.DASHBOARD,
  ROUTES.SCHEDULE,
  ROUTES.PATIENTS,
  ROUTES.PRACTITIONERS,
  ROUTES.VISITS,
  ROUTES.NOTE_TEMPLATES,
  ROUTES.REPORTS,
  ROUTES.SETTINGS,
] as const;

export const NAV_ACCESS: { prefix: string; roles?: Role[] }[] = [
  { prefix: ROUTES.PROFILE, roles: [ROLE.OWNER, ROLE.PRACTITIONER] },
  { prefix: ROUTES.EMAILS, roles: STAFF },
  { prefix: ROUTES.HOME, roles: PRACTITIONER },
  { prefix: ROUTES.DASHBOARD, roles: OPS },
  { prefix: ROUTES.SCHEDULE, roles: [...STAFF, ROLE.PRACTITIONER] },
  { prefix: ROUTES.PATIENTS, roles: [...STAFF, ROLE.PRACTITIONER] },
  { prefix: ROUTES.PRACTITIONERS, roles: STAFF },
  { prefix: ROUTES.VISITS, roles: VISITS },
  { prefix: ROUTES.NOTE_TEMPLATES, roles: [ROLE.OWNER] },
  { prefix: ROUTES.REPORTS, roles: REPORTS },
  { prefix: ROUTES.SETTINGS_SCHEDULE_REQUESTS, roles: [...STAFF, ROLE.PRACTITIONER] },
  { prefix: ROUTES.SETTINGS_NOTIFICATIONS, roles: [...STAFF, ROLE.PRACTITIONER] },
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
  if (pathname === ROUTES.SETTINGS && role === ROLE.PRACTITIONER) return true;
  if (role === ROLE.PRACTITIONER && (pathname === ROUTES.PATIENT_NEW || /^\/patients\/[^/]+\/edit$/.test(pathname))) return false;
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
