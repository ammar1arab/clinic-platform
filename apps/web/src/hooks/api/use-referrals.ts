import {
  referralsService,
  CreateReferralInput,
  ReferralFilters,
  Referral,
} from '@/services/referrals.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError, useApiMutation, INVALIDATE } from '../query';
import { useLanguage } from '@/providers';

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
  const { t } = useLanguage();
  return useApiMutation<Referral, TResponseError, CreateReferralInput>({
    request: (data) => referralsService.create(data),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: t.common.requestSent,
  });
}

export function useAcceptReferral(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<Referral, TResponseError, string>({
    request: (id) => referralsService.accept(id),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: t.common.referralAccepted,
  });
}

export function useRejectReferral(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<Referral, TResponseError, string>({
    request: (id) => referralsService.reject(id),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: t.common.referralRejected,
  });
}

export function useSaveOpinion(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<Referral, TResponseError, { id: string; opinion: string }>({
    request: ({ id, opinion }) => referralsService.setOpinion(id, opinion),
    invalidateQueries: [...INVALIDATE.referralWrite],
    successMessage: t.common.opinionSaved,
  });
}
