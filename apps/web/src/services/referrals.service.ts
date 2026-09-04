import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreateReferralInput,
  Referral,
  ReferralFilters,
  ReferralStatus,
  ReferralType,
  ReferralUrgency,
} from "@clinic/types";

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
    api
      .get<Referral[]>(ENDPOINTS.REFERRALS.BASE, { params: filters })
      .then((r) => r.data),

  create: (data: CreateReferralInput) =>
    api.post<Referral>(ENDPOINTS.REFERRALS.BASE, data).then((r) => r.data),

  accept: (id: string) =>
    api.patch<Referral>(ENDPOINTS.REFERRALS.ACCEPT(id)).then((r) => r.data),

  reject: (id: string) =>
    api.patch<Referral>(ENDPOINTS.REFERRALS.REJECT(id)).then((r) => r.data),

  setOpinion: (id: string, opinion: string) =>
    api
      .patch<Referral>(ENDPOINTS.REFERRALS.OPINION(id), { opinion })
      .then((r) => r.data),
};
