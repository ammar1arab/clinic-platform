import { ROLE, type Role } from './enums';

const CLINIC_MANAGERS: readonly Role[] = [ROLE.OWNER, ROLE.ADMIN];
const CLINICAL_STAFF: readonly Role[] = [ROLE.OWNER, ROLE.ADMIN, ROLE.PRACTITIONER];

export const APPOINTMENT_PERMISSIONS = {
  patient: CLINIC_MANAGERS,
  doctor: CLINIC_MANAGERS,
  department: CLINIC_MANAGERS,
  service: CLINIC_MANAGERS,
  schedule: CLINIC_MANAGERS,
  session: CLINIC_MANAGERS,
  billing: CLINIC_MANAGERS,
  notes: CLINIC_MANAGERS,
  status: CLINICAL_STAFF,
} as const;

export type AppointmentPermission = keyof typeof APPOINTMENT_PERMISSIONS;

const APPOINTMENT_UPDATE_KEYS: Record<AppointmentPermission, readonly string[]> = {
  patient: ['patientId'],
  doctor: ['doctorId'],
  department: ['departmentId'],
  service: ['serviceId'],
  schedule: ['scheduledAt', 'durationMins'],
  session: ['sessionType', 'roomId', 'meetingUrl'],
  billing: ['feeOverride', 'discount', 'discountType', 'discountReason', 'discountCodeId'],
  notes: ['notes'],
  status: ['status', 'cancelReason', 'statusReason'],
};

export const PROFILE_PERMISSIONS = {
  identity: CLINICAL_STAFF,
  professional: CLINIC_MANAGERS,
  services: CLINIC_MANAGERS,
  availability: CLINIC_MANAGERS,
  credentials: CLINIC_MANAGERS,
} as const;

export type ProfilePermission = keyof typeof PROFILE_PERMISSIONS;

export function can(role: Role | null | undefined, allowed: readonly Role[]): boolean {
  return !!role && allowed.includes(role);
}

export function canEditAppointment(
  role: Role | null | undefined,
  permission: AppointmentPermission,
): boolean {
  return can(role, APPOINTMENT_PERMISSIONS[permission]);
}

export function appointmentAccess(
  role: Role | null | undefined,
): Record<AppointmentPermission, boolean> {
  return {
    patient: canEditAppointment(role, 'patient'),
    doctor: canEditAppointment(role, 'doctor'),
    department: canEditAppointment(role, 'department'),
    service: canEditAppointment(role, 'service'),
    schedule: canEditAppointment(role, 'schedule'),
    session: canEditAppointment(role, 'session'),
    billing: canEditAppointment(role, 'billing'),
    notes: canEditAppointment(role, 'notes'),
    status: canEditAppointment(role, 'status'),
  };
}

export function appointmentUpdateDenied(
  role: Role | null | undefined,
  keys: readonly string[],
): string[] {
  if (!role) return [];
  const allowed = new Set<string>();
  (Object.keys(APPOINTMENT_UPDATE_KEYS) as AppointmentPermission[]).forEach((permission) => {
    if (!canEditAppointment(role, permission)) return;
    APPOINTMENT_UPDATE_KEYS[permission].forEach((key) => allowed.add(key));
  });
  const gated = new Set<string>(Object.values(APPOINTMENT_UPDATE_KEYS).flat());
  return keys.filter((key) => gated.has(key) && !allowed.has(key));
}
