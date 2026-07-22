import { api } from '@/lib/api';
import type {
  CreateReferralInput,
  Referral,
  ReferralFilters,
  ReferralStatus,
  ReferralType,
  ReferralUrgency,
} from '@clinic/types';

export type {
  CreateReferralInput,
  Referral,
  ReferralFilters,
  ReferralStatus,
  ReferralType,
  ReferralUrgency,
};

export const referralsService = {
  getAll: (filters: ReferralFilters) =>
    api.get<Referral[]>('/referrals', { params: filters }).then((r) => r.data),

  create: (data: CreateReferralInput) =>
    api.post<Referral>('/referrals', data).then((r) => r.data),

  accept: (id: string) => api.patch<Referral>(`/referrals/${id}/accept`).then((r) => r.data),

  reject: (id: string) => api.patch<Referral>(`/referrals/${id}/reject`).then((r) => r.data),

  setOpinion: (id: string, opinion: string) =>
    api.patch<Referral>(`/referrals/${id}/opinion`, { opinion }).then((r) => r.data),
};
