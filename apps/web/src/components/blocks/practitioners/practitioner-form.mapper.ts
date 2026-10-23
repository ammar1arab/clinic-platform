import { format } from 'date-fns';
import type {
  CreatePractitionerInput,
  PractitionerDetail,
  UpdatePractitionerInput,
} from '@/services/practitioners.service';
import type { PractitionerFormData, PractitionerHoursData } from '@/lib/validations';
import { pickRandomAvatarUrl, persistableImageUrl, resolveAvatarUrl } from '@/lib/avatars';

export function emptyPractitionerValues(): PractitionerFormData {
  return {
    name: '',
    nameAr: '',
    title: '',
    email: '',
    phone: '',
    whatsapp: '',
    nationality: '',
    specialty: '',
    specialtyAr: '',
    languages: ['ar', 'en'],
    dob: '',
    gender: '',
    bio: '',
    bioAr: '',
    experienceYears: '',
    imageUrl: pickRandomAvatarUrl(),
    licenseNumber: '',
    licenseExpiry: '',
    departmentId: '',
    defaultRoomId: '',
    employmentType: '',
    commissionPercent: '',
    bufferMins: '0',
    serviceIds: [],
    availabilities: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
    timeOffs: [],
    availabilityOverrides: [],
  };
}

const clean = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

export function toPractitionerFormValues(
  p: PractitionerDetail,
): PractitionerFormData {
  return {
    name: p.name,
    nameAr: p.nameAr ?? '',
    title: p.title ?? '',
    email: p.email,
    phone: p.phone ?? '',
    whatsapp: p.whatsapp ?? '',
    nationality: p.nationality ?? '',
    specialty: p.specialty ?? '',
    specialtyAr: p.specialtyAr ?? '',
    languages: p.languages ?? [],
    dob: p.dob?.slice(0, 10) ?? '',
    gender: p.gender ?? '',
    bio: p.bio ?? '',
    bioAr: p.bioAr ?? '',
    experienceYears:
      p.experienceYears == null ? '' : String(p.experienceYears),
    imageUrl: resolveAvatarUrl(p.imageUrl, p.id),
    licenseNumber: p.licenseNumber ?? '',
    licenseExpiry: p.licenseExpiry?.slice(0, 10) ?? '',
    departmentId: p.departmentId ?? '',
    defaultRoomId: p.defaultRoomId ?? '',
    employmentType: p.employmentType ?? '',
    commissionPercent:
      p.commissionPercent == null ? '' : String(p.commissionPercent),
    bufferMins: String(p.bufferMins ?? 0),
    serviceIds: p.serviceIds ?? [],
    availabilities: p.availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      effectiveFrom: a.effectiveFrom?.slice(0, 10) ?? '',
      effectiveUntil: a.effectiveUntil?.slice(0, 10) ?? '',
    })),
    timeOffs: p.timeOffs.map((t) => ({
      startDate: format(new Date(t.startDate), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(new Date(t.endDate), "yyyy-MM-dd'T'HH:mm"),
      reason: t.reason ?? '',
      kind: t.kind,
    })),
    availabilityOverrides: p.availabilityOverrides.map((entry) => ({
      startAt: format(new Date(entry.startAt), "yyyy-MM-dd'T'HH:mm"),
      endAt: format(new Date(entry.endAt), "yyyy-MM-dd'T'HH:mm"),
      reason: entry.reason ?? '',
    })),
  };
}

export function toPractitionerPayload(data: PractitionerFormData) {
  const employmentType = data.employmentType
    ? (data.employmentType as 'salaried' | 'commission' | 'mixed')
    : undefined;

  const needsCommission =
    employmentType === 'commission' || employmentType === 'mixed';

  return {
    name: data.name.trim(),
    nameAr: clean(data.nameAr),
    title: clean(data.title),
    phone: clean(data.phone),
    whatsapp: clean(data.whatsapp) ?? null,
    nationality: data.nationality?.trim()
      ? data.nationality.trim().toUpperCase()
      : null,
    specialty: clean(data.specialty) ?? null,
    specialtyAr: clean(data.specialtyAr) ?? null,
    languages: data.languages,
    dob: clean(data.dob),
    gender: clean(data.gender) ?? null,
    bio: clean(data.bio),
    bioAr: clean(data.bioAr),
    experienceYears: data.experienceYears?.trim()
      ? Number(data.experienceYears)
      : undefined,
    imageUrl: persistableImageUrl(data.imageUrl),
    licenseNumber: clean(data.licenseNumber),
    licenseExpiry: clean(data.licenseExpiry),
    departmentId: data.departmentId,
    defaultRoomId: data.defaultRoomId?.trim() || null,
    employmentType,
    commissionPercent: needsCommission
      ? Number(data.commissionPercent)
      : null,
    bufferMins: Number(data.bufferMins),
    serviceIds: data.serviceIds,
    availabilities: data.availabilities.map((a) => ({
      dayOfWeek: Number(a.dayOfWeek),
      startTime: a.startTime,
      endTime: a.endTime,
      effectiveFrom: clean(a.effectiveFrom),
      effectiveUntil: clean(a.effectiveUntil),
    })),
    timeOffs: data.timeOffs.map((t) => ({
      startDate: new Date(t.startDate).toISOString(),
      endDate: new Date(t.endDate).toISOString(),
      reason: clean(t.reason),
      kind: t.kind,
    })),
    availabilityOverrides: data.availabilityOverrides.map((entry) => ({
      startAt: new Date(entry.startAt).toISOString(),
      endAt: new Date(entry.endAt).toISOString(),
      reason: clean(entry.reason),
    })),
  } satisfies Omit<CreatePractitionerInput, 'clinicId' | 'email'> &
    UpdatePractitionerInput;
}

export function toHoursFormValues(p: PractitionerDetail): PractitionerHoursData {
  const values = toPractitionerFormValues(p);
  return {
    availabilities: values.availabilities,
    timeOffs: values.timeOffs,
    availabilityOverrides: values.availabilityOverrides,
  };
}

export function toHoursPayload(data: PractitionerHoursData) {
  return {
    availabilities: data.availabilities.map((a) => ({
      dayOfWeek: Number(a.dayOfWeek),
      startTime: a.startTime,
      endTime: a.endTime,
      effectiveFrom: clean(a.effectiveFrom),
      effectiveUntil: clean(a.effectiveUntil),
    })),
    timeOffs: data.timeOffs.map((t) => ({
      startDate: new Date(t.startDate).toISOString(),
      endDate: new Date(t.endDate).toISOString(),
      reason: clean(t.reason),
    })),
    availabilityOverrides: data.availabilityOverrides.map((entry) => ({
      startAt: new Date(entry.startAt).toISOString(),
      endAt: new Date(entry.endAt).toISOString(),
      reason: clean(entry.reason),
    })),
  };
}
