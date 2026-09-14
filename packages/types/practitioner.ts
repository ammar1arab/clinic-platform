import type { EmploymentType, Role } from './enums';

export interface DoctorAvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  isActive?: boolean;
}

export interface DoctorTimeOffEntry {
  id?: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface DoctorAvailabilityOverrideEntry {
  id?: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
}

export interface PractitionerServiceRef {
  id: string;
  name: string;
  nameAr: string | null;
  durationMins: number;
  fee: string;
}

export interface Practitioner {
  id: string;
  clinicId: string;
  userId: string;
  role: Role;
  name: string;
  nameAr: string | null;
  title: string | null;
  phone: string | null;
  whatsapp: string | null;
  nationality: string | null;
  specialty: string | null;
  specialtyAr: string | null;
  languages: string[];
  email: string;
  initials: string | null;
  dob: string | null;
  gender: string | null;
  bio: string | null;
  bioAr: string | null;
  experienceYears: number | null;
  imageUrl: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  departmentId: string | null;
  departmentName: string | null;
  departmentNameAr: string | null;
  defaultRoomId: string | null;
  defaultRoomName: string | null;
  defaultRoomNameAr: string | null;
  employmentType: EmploymentType | null;
  commissionPercent: number | null;
  bufferMins: number;
  isActive: boolean;
  serviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PractitionerDetail extends Practitioner {
  services: PractitionerServiceRef[];
  availabilities: DoctorAvailabilitySlot[];
  timeOffs: DoctorTimeOffEntry[];
  availabilityOverrides: DoctorAvailabilityOverrideEntry[];
}

export interface CreatePractitionerInput {
  clinicId: string;
  email: string;
  name: string;
  nameAr?: string;
  title?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  nationality?: string | null;
  specialty?: string | null;
  specialtyAr?: string | null;
  languages?: string[];
  dob?: string;
  gender?: string | null;
  bio?: string;
  bioAr?: string;
  experienceYears?: number;
  imageUrl?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  departmentId: string;
  defaultRoomId?: string | null;
  employmentType?: EmploymentType;
  commissionPercent?: number | null;
  bufferMins?: number;
  serviceIds?: string[];
  availabilities?: DoctorAvailabilitySlot[];
  timeOffs?: DoctorTimeOffEntry[];
  availabilityOverrides?: DoctorAvailabilityOverrideEntry[];
}

export interface UpdatePractitionerInput {
  name?: string;
  nameAr?: string | null;
  title?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  nationality?: string | null;
  specialty?: string | null;
  specialtyAr?: string | null;
  languages?: string[];
  dob?: string | null;
  gender?: string | null;
  bio?: string | null;
  bioAr?: string | null;
  experienceYears?: number | null;
  imageUrl?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  departmentId?: string;
  defaultRoomId?: string | null;
  employmentType?: EmploymentType | null;
  commissionPercent?: number | null;
  bufferMins?: number;
  isActive?: boolean;
  serviceIds?: string[];
  availabilities?: DoctorAvailabilitySlot[];
  timeOffs?: DoctorTimeOffEntry[];
  availabilityOverrides?: DoctorAvailabilityOverrideEntry[];
}

export interface CreatePractitionerResult {
  practitioner: PractitionerDetail;
  welcomeEmailSent: boolean;
}

export interface AssignServicesInput {
  serviceIds: string[];
}

export interface ReplaceAvailabilityInput {
  availabilities: DoctorAvailabilitySlot[];
}

export interface ReplaceTimeOffInput {
  timeOffs: DoctorTimeOffEntry[];
}

export interface ReplaceAvailabilityOverridesInput {
  availabilityOverrides: DoctorAvailabilityOverrideEntry[];
}

export interface PractitionerFilters {
  clinicId: string;
  search?: string;
  status?: string;
  departmentId?: string;
  employmentType?: string;
  gender?: string;
  language?: string;
  specialty?: string;
  roomId?: string;
  nationality?: string;
  license?: string;
  experience?: string;
  sort?: string;
}
