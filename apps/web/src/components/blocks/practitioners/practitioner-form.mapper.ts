import type {
  CreatePractitionerInput,
  PractitionerDetail,
  UpdatePractitionerInput,
} from '@/services/practitioners.service';
import type { PractitionerFormData } from '@/lib/validations';

export const EMPTY_PRACTITIONER: PractitionerFormData = {
  name: '',
  nameAr: '',
  title: '',
  email: '',
  phone: '',
  dob: '',
  bio: '',
  bioAr: '',
  experienceYears: '',
  imageUrl: '',
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
};

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
    dob: p.dob?.slice(0, 10) ?? '',
    bio: p.bio ?? '',
    bioAr: p.bioAr ?? '',
    experienceYears:
      p.experienceYears == null ? '' : String(p.experienceYears),
    imageUrl: p.imageUrl ?? '',
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
    })),
    timeOffs: p.timeOffs.map((t) => ({
      startDate: t.startDate.slice(0, 10),
      endDate: t.endDate.slice(0, 10),
      reason: t.reason ?? '',
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
    dob: clean(data.dob),
    bio: clean(data.bio),
    bioAr: clean(data.bioAr),
    experienceYears: data.experienceYears?.trim()
      ? Number(data.experienceYears)
      : undefined,
    imageUrl: clean(data.imageUrl),
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
    })),
    timeOffs: data.timeOffs.map((t) => ({
      startDate: t.startDate,
      endDate: t.endDate,
      reason: clean(t.reason),
    })),
  } satisfies Omit<CreatePractitionerInput, 'clinicId' | 'email'> &
    UpdatePractitionerInput;
}
