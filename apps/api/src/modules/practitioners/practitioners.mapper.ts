import type { PractitionersRepository } from "./practitioners.repository";

type Row = NonNullable<
  Awaited<ReturnType<PractitionersRepository["findById"]>>
>;

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function toNumber(value: { toNumber?: () => number } | number | null | undefined) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value);
}

export function mapPractitioner(row: Row) {
  return {
    id: row.id,
    clinicId: row.clinicId,
    userId: row.userId,
    role: row.role,
    name: row.name,
    nameAr: row.nameAr,
    title: row.title,
    phone: row.phone,
    email: row.user.email,
    initials: row.initials,
    dob: row.dob?.toISOString() ?? null,
    bio: row.bio,
    bioAr: row.bioAr,
    experienceYears: row.experienceYears,
    imageUrl: row.imageUrl,
    licenseNumber: row.licenseNumber,
    licenseExpiry: row.licenseExpiry?.toISOString() ?? null,
    departmentId: row.departmentId,
    departmentName: row.department?.name ?? null,
    defaultRoomId: row.defaultRoomId,
    defaultRoomName: row.defaultRoom?.name ?? null,
    employmentType: row.employmentType,
    commissionPercent: toNumber(row.commissionPercent),
    calendarColor: (row.calendarColor as
      | "brand"
      | "accent-teal"
      | "primary"
      | "success"
      | "warning"
      | "destructive"
      | null) ?? null,
    bufferMins: row.bufferMins,
    isActive: row.isActive,
    serviceIds: row.services.map((s) => s.serviceId),
    services: row.services.map((s) => ({
      id: s.service.id,
      name: s.service.name,
      nameAr: s.service.nameAr,
      durationMins: s.service.durationMins,
      fee: String(s.service.fee),
    })),
    availabilities: row.availabilities.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isActive: a.isActive,
    })),
    timeOffs: row.timeOffs.map((t) => ({
      id: t.id,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      reason: t.reason,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** undefined = leave unchanged; null/'' = clear */
export function optStr(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function optDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  return value ? new Date(value) : null;
}
