import type { QueryKey } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';

export type FetchOptions = {
  enabled?: boolean;
  retry?: boolean | number;
  staleTime?: number;
  gcTime?: number;
  keepPreviousData?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnReconnect?: boolean;
  skipNormalization?: boolean;
};

export function clinicListOptions(clinicId: string): FetchOptions {
  return { enabled: !!clinicId };
}

export const LIVE_LIST_OPTIONS: FetchOptions = {
  staleTime: 45_000,
  gcTime: 5 * 60_000,
  keepPreviousData: true,
  refetchOnWindowFocus: false,
};

export const DASHBOARD_OPTIONS: FetchOptions = {
  staleTime: 60_000,
};

export const BILLING_OPTIONS: FetchOptions = {
  staleTime: 30_000,
};

export function toQueryOptions(options?: FetchOptions) {
  const {
    keepPreviousData: keepPrev,
    retry,
    refetchOnWindowFocus,
    skipNormalization: _skip,
    ...rest
  } = options ?? {};

  return {
    retry: retry ?? false,
    refetchOnWindowFocus: refetchOnWindowFocus ?? false,
    ...(keepPrev ? { placeholderData: keepPreviousData } : {}),
    ...rest,
  };
}

export const INVALIDATE = {
  appointmentWrite: [
    QUERY_KEYS.appointments.all,
    QUERY_KEYS.dashboard.kpisAll,
    QUERY_KEYS.dashboard.roomUtilizationAll,
  ] as const satisfies readonly QueryKey[],

  appointmentPayment: [QUERY_KEYS.appointments.all] as const satisfies readonly QueryKey[],

  appointmentPackage: [
    QUERY_KEYS.appointments.all,
    QUERY_KEYS.patientPackages.all,
  ] as const satisfies readonly QueryKey[],

  patientWrite: [
    QUERY_KEYS.patients.all,
    QUERY_KEYS.patientPackages.all,
  ] as const satisfies readonly QueryKey[],

  patientStatus: [QUERY_KEYS.patients.all] as const satisfies readonly QueryKey[],

  referralWrite: [
    QUERY_KEYS.referrals.all,
    QUERY_KEYS.patients.all,
  ] as const satisfies readonly QueryKey[],

  patientPackageWrite: [
    QUERY_KEYS.patientPackages.all,
  ] as const satisfies readonly QueryKey[],
} as const;
