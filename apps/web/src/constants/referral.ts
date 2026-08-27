import type { ReferralUrgency } from '@/services/referrals.service';

export const REFERRAL_URGENCY_VARIANT: Record<
  ReferralUrgency,
  'outline' | 'warning' | 'destructive'
> = {
  normal: 'outline',
  high: 'warning',
  urgent: 'destructive',
};
