import {
  referralsService,
  CreateReferralInput,
  ReferralFilters,
  Referral,
} from '@/services/referrals.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';
import { INVALIDATE } from './query-presets';

export function useReferrals(filters: ReferralFilters) {
  return useFetchData<Referral[]>({
    queryKey: QUERY_KEYS.referrals.list(filters),
    request: () => referralsService.getAll(filters),
    options: {
      enabled: !!filters.clinicId,
    },
  });
}

export function useCreateReferral(_clinicId?: string) {
  return useApiMutation<Referral, TResponseError, CreateReferralInput>({
    request: (data) => referralsService.create(data),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: 'Request sent',
  });
}

export function useAcceptReferral(_clinicId?: string) {
  return useApiMutation<Referral, TResponseError, string>({
    request: (id) => referralsService.accept(id),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: 'Referral accepted',
  });
}

export function useRejectReferral(_clinicId?: string) {
  return useApiMutation<Referral, TResponseError, string>({
    request: (id) => referralsService.reject(id),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: 'Referral rejected',
  });
}

export function useReferralOpinion(_clinicId?: string) {
  return useApiMutation<Referral, TResponseError, { id: string; opinion: string }>({
    request: ({ id, opinion }) => referralsService.setOpinion(id, opinion),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: 'Opinion saved',
  });
}
