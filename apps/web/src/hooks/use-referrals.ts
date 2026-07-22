import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  referralsService,
  CreateReferralInput,
  ReferralFilters,
} from '@/services/referrals.service';
import { QUERY_KEYS } from '@/constants/query-keys';

export function useReferrals(filters: ReferralFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.referrals.list(filters),
    queryFn: () => referralsService.getAll(filters),
    enabled: !!filters.clinicId,
  });
}

export function useCreateReferral(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferralInput) => referralsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referrals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      toast.success('Request sent');
    },
  });
}

export function useAcceptReferral(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralsService.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referrals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      toast.success('Referral accepted');
    },
  });
}

export function useRejectReferral(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralsService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referrals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      toast.success('Referral rejected');
    },
  });
}

export function useReferralOpinion(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opinion }: { id: string; opinion: string }) =>
      referralsService.setOpinion(id, opinion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referrals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      toast.success('Opinion saved');
    },
  });
}
