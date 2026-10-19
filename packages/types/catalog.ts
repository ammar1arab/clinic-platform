import type { ServiceSessionMode } from './enums';

export interface Department {
  id: string;
  clinicId: string;
  name: string;
  nameAr: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  clinicId: string;
  name: string;
  nameAr?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentInput {
  name?: string;
  nameAr?: string;
  isActive?: boolean;
}

export interface Room {
  id: string;
  clinicId: string;
  departmentId: string | null;
  name: string;
  nameAr: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomInput {
  clinicId: string;
  departmentId?: string;
  name: string;
  nameAr?: string;
  isActive?: boolean;
}

export interface UpdateRoomInput {
  departmentId?: string;
  name?: string;
  nameAr?: string;
  isActive?: boolean;
}

export interface ServiceItem {
  id: string;
  clinicId: string;
  departmentId: string | null;
  name: string;
  nameAr: string | null;
  durationMins: number;
  fee: string;
  supportedModes?: ServiceSessionMode[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceInput {
  clinicId: string;
  departmentId?: string;
  name: string;
  nameAr?: string;
  durationMins?: number;
  fee: number;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  departmentId?: string;
  name?: string;
  nameAr?: string;
  durationMins?: number;
  fee?: number;
  isActive?: boolean;
}
