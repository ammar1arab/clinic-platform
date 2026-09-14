import type { PractitionerFiltersDto } from "./dto";

function licenseBucket(licenseExpiry: string | null | undefined, now: Date) {
  if (!licenseExpiry) return "missing";
  const expiry = new Date(licenseExpiry);
  if (Number.isNaN(expiry.getTime()) || expiry < now) return "expired";
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 60);
  if (expiry <= soon) return "expiring";
  return "valid";
}

function experienceBucket(years: number) {
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 10) return "6-10";
  return "10+";
}

function sortValue(
  row: {
    name: string;
    departmentName?: string | null;
    specialty?: string | null;
    experienceYears?: number | null;
    licenseExpiry?: string | null;
    createdAt?: string;
  },
  key: string,
) {
  if (key === "createdAt") return row.createdAt;
  if (key === "department") return row.departmentName;
  if (key === "specialty") return row.specialty;
  if (key === "experience") return row.experienceYears;
  if (key === "licenseExpiry") return row.licenseExpiry;
  return row.name;
}

export function filterPractitioners<
  T extends {
    name: string;
    nameAr?: string | null;
    email: string;
    phone?: string | null;
    departmentName?: string | null;
    licenseNumber?: string | null;
    licenseExpiry?: string | null;
    specialty?: string | null;
    title?: string | null;
    isActive: boolean;
    departmentId?: string | null;
    employmentType?: string | null;
    gender?: string | null;
    languages: string[];
    defaultRoomId?: string | null;
    nationality?: string | null;
    experienceYears?: number | null;
    createdAt?: string;
  },
>(rows: T[], filters?: PractitionerFiltersDto): T[] {
  if (!filters) return rows;
  const term = filters.search?.trim().toLowerCase() ?? "";
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = rows.filter((row) => {
    if (filters.status === "active" && !row.isActive) return false;
    if (filters.status === "inactive" && row.isActive) return false;
    if (filters.departmentId && row.departmentId !== filters.departmentId)
      return false;
    if (filters.employmentType && row.employmentType !== filters.employmentType)
      return false;
    if (filters.gender && row.gender !== filters.gender) return false;
    if (filters.language && !row.languages.includes(filters.language))
      return false;
    if (filters.specialty && row.specialty !== filters.specialty) return false;
    if (filters.roomId && row.defaultRoomId !== filters.roomId) return false;
    if (filters.nationality && row.nationality !== filters.nationality)
      return false;
    if (filters.license && filters.license !== "all") {
      if (licenseBucket(row.licenseExpiry, now) !== filters.license)
        return false;
    }
    if (filters.experience && filters.experience !== "all") {
      if (row.experienceYears == null) return false;
      if (experienceBucket(row.experienceYears) !== filters.experience)
        return false;
    }
    if (!term) return true;
    return [
      row.name,
      row.nameAr,
      row.email,
      row.phone,
      row.departmentName,
      row.licenseNumber,
      row.specialty,
      row.title,
    ].some(
      (field) =>
        typeof field === "string" && field.toLowerCase().includes(term),
    );
  });

  const [key, dir] = (filters.sort ?? "name:asc").split(":");
  const sign = dir === "desc" ? -1 : 1;
  return [...filtered].sort((left, right) => {
    const av = sortValue(left, key);
    const bv = sortValue(right, key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  });
}
