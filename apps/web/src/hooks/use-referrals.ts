import { toast } from 'sonner';
import {
  referralsService,
  CreateReferralInput,
  ReferralFilters,
  Referral,
} from '@/services/referrals.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';

export function useReferrals(filters: ReferralFilters) {
  return useFetchData<Referral[]>({
    queryKey: QUERY_KEYS.referrals.list(filters),
    request: () => referralsService.getAll(filters),
    options: {
      enabled: !!filters.clinicId,
    },
  });
}

export function useCreateReferral(clinicId?: string) {
  void clinicId;
  return useApiMutation<Referral, unknown, CreateReferralInput>({
    request: (data) => referralsService.create(data),
    invalidateQueries: [QUERY_KEYS.referrals.all, QUERY_KEYS.patients.all],
    onSuccess: () => {
      toast.success('Request sent');
    },
  });
}

export function useAcceptReferral(clinicId?: string) {
  void clinicId;
  return useApiMutation<Referral, unknown, string>({
    request: (id) => referralsService.accept(id),
    invalidateQueries: [QUERY_KEYS.referrals.all, QUERY_KEYS.patients.all],
    onSuccess: () => {
      toast.success('Referral accepted');
    },
  });
}

export function useRejectReferral(clinicId?: string) {
  void clinicId;
  return useApiMutation<Referral, unknown, string>({
    request: (id) => referralsService.reject(id),
    invalidateQueries: [QUERY_KEYS.referrals.all, QUERY_KEYS.patients.all],
    onSuccess: () => {
      toast.success('Referral rejected');
    },
  });
}

export function useReferralOpinion(clinicId?: string) {
  void clinicId;
  return useApiMutation<Referral, unknown, { id: string; opinion: string }>({
    request: ({ id, opinion }) => referralsService.setOpinion(id, opinion),
    invalidateQueries: [QUERY_KEYS.referrals.all, QUERY_KEYS.patients.all],
    onSuccess: () => {
      toast.success('Opinion saved');
    },
  });
}
