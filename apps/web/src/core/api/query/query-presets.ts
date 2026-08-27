import type { QueryKey } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
import type { IFetchDataOptions } from './hooks/use-fetch-data';

/** Clinic-scoped list query — used by createCrudHooks list hooks. */
export function clinicListOptions(clinicId: string): IFetchDataOptions {
  return { enabled: !!clinicId };
}

/** Live schedule/list polling feel without refetch-on-focus noise. */
export const LIVE_LIST_OPTIONS: IFetchDataOptions = {
  staleTime: 45_000,
  gcTime: 5 * 60_000,
  keepPreviousData: true,
  refetchOnWindowFocus: false,
};

export const DASHBOARD_OPTIONS: IFetchDataOptions = {
  staleTime: 60_000,
};

export const BILLING_OPTIONS: IFetchDataOptions = {
  staleTime: 30_000,
};

/** Maps our options → TanStack Query v5 (keepPreviousData → placeholderData). */
export function toQueryOptions(options?: IFetchDataOptions) {
  const {
    keepPreviousData: keepPrev,
    retry,
    refetchOnWindowFocus,
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
