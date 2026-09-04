import { getTranslations } from '@/i18n';
import type { PatientPackageDto } from '@clinic/types';
import { CLINIC_CURRENCY } from '@/constants/appointment';

export const PACKAGE_CURRENCY = CLINIC_CURRENCY;

export function formatClinicNumber(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(3);
}

export function formatClinicAmount(value: string | number | null | undefined) {
  return `${formatClinicNumber(value)} ${CLINIC_CURRENCY}`;
}

export function formatPackageBalance(
  pkg: PatientPackageDto,
  lang = 'en',
): string {
  const t = getTranslations(lang);
  if (pkg.sessionsTotal != null) {
    const template =
      pkg.sessionsTotal === 1
        ? t.packageBalance.session
        : t.packageBalance.sessions;
    return template
      .replace('{left}', String(pkg.sessionsRemaining ?? 0))
      .replace('{total}', String(pkg.sessionsTotal));
  }
  return t.packageBalance.credit.replace(
    '{amount}',
    formatClinicAmount(pkg.creditRemaining),
  );
}

export function formatPackageRedeemCost(
  pkg: PatientPackageDto,
  payable: number,
  lang = 'en',
): string {
  if (pkg.sessionsTotal != null)
    return getTranslations(lang).packageBalance.oneSession;
  return formatClinicAmount(payable);
}

export function canCoverVisit(
  pkg: PatientPackageDto,
  payable: number,
): boolean {
  if (!pkg.hasBalance || !pkg.isActive) return false;
  if (pkg.sessionsTotal != null) return (pkg.sessionsRemaining ?? 0) > 0;
  return Number(pkg.creditRemaining ?? 0) + 1e-9 >= payable;
}
