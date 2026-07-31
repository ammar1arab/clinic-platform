import type { PatientPackageDto } from '@clinic/types';

const CURRENCY = 'JOD';


export function formatPackageBalance(pkg: PatientPackageDto): string {
  if (pkg.sessionsTotal != null) {
    const left = pkg.sessionsRemaining ?? 0;
    const total = pkg.sessionsTotal;
    return `${left} of ${total} session${total === 1 ? '' : 's'} left`;
  }
  return `${Number(pkg.creditRemaining ?? 0).toFixed(3)} ${CURRENCY} left`;
}


export function formatPackageRedeemCost(
  pkg: PatientPackageDto,
  payable: number,
): string {
  if (pkg.sessionsTotal != null) {
    return '1 session';
  }
  return `${payable.toFixed(3)} ${CURRENCY}`;
}

export function canCoverVisit(pkg: PatientPackageDto, payable: number): boolean {
  if (!pkg.hasBalance || !pkg.isActive) return false;
  if (pkg.sessionsTotal != null) return (pkg.sessionsRemaining ?? 0) > 0;
  return Number(pkg.creditRemaining ?? 0) + 1e-9 >= payable;
}

export { CURRENCY as PACKAGE_CURRENCY };
