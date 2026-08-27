import type { DiscountType } from './enums';

export interface PaymentMethodDto {
  id: string;
  clinicId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodInput {
  clinicId: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface PackageDto {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  sessionCount: number | null;
  price: string | null;
  discountType: DiscountType | null;
  discountValue: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageInput {
  clinicId: string;
  name: string;
  description?: string;
  sessionCount?: number;
  price?: number;
  discountType?: DiscountType;
  discountValue?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdatePackageInput {
  name?: string;
  description?: string | null;
  sessionCount?: number | null;
  price?: number | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}


export interface PatientPackageDto {
  id: string;
  clinicId: string;
  patientId: string;
  packageId: string;
  packageName: string;
  sessionsTotal: number | null;
  sessionsUsed: number;
  sessionsRemaining: number | null;
  creditTotal: string | null;
  creditUsed: string;
  creditRemaining: string | null;

  hasBalance: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientBillingSummary {

  outstanding: string;
  unpaidVisits: number;
  packages: PatientPackageDto[];
}

export interface EnrollPatientPackageInput {
  patientId: string;
  packageId: string;
  sessionsTotal?: number | null;
  creditTotal?: number | null;
  notes?: string;
}

export interface DiscountCodeDto {
  id: string;
  clinicId: string;
  code: string;
  discountType: DiscountType;
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountCodeInput {
  clinicId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface UpdateDiscountCodeInput {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxUses?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
}

export interface ValidatedDiscountCodeDto {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
}
