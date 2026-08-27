import type { PatientPackageDto } from '@clinic/types';
import { CLINIC_CURRENCY } from '@/constants/appointment';

export const PACKAGE_CURRENCY = CLINIC_CURRENCY;

export function formatClinicNumber(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(3);
}

export function formatClinicAmount(value: string | number | null | undefined) {
  return `${formatClinicNumber(value)} ${CLINIC_CURRENCY}`;
}

export function formatPackageBalance(pkg: PatientPackageDto): string {
  if (pkg.sessionsTotal != null) {
    const left = pkg.sessionsRemaining ?? 0;
    const total = pkg.sessionsTotal;
    return `${left} of ${total} session${total === 1 ? '' : 's'} left`;
  }
  return `${formatClinicAmount(pkg.creditRemaining)} left`;
}

export function formatPackageRedeemCost(
  pkg: PatientPackageDto,
  payable: number,
): string {
  if (pkg.sessionsTotal != null) return '1 session';
  return formatClinicAmount(payable);
}

export function canCoverVisit(pkg: PatientPackageDto, payable: number): boolean {
  if (!pkg.hasBalance || !pkg.isActive) return false;
  if (pkg.sessionsTotal != null) return (pkg.sessionsRemaining ?? 0) > 0;
  return Number(pkg.creditRemaining ?? 0) + 1e-9 >= payable;
}
