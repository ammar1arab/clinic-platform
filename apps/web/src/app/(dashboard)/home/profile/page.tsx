'use client';

import { PractitionerSelfProfile } from '@/components/blocks/practitioners/practitioner-self-profile';
import { EmptyState, PageLoadingState } from '@/components/primitives';
import { IconPractitioner } from '@/constants/icons';
import { usePractitioner } from '@/hooks/api/use-practitioners';
import { useAuth, useLanguage } from '@/providers';

export default function PractitionerProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const practitioner = usePractitioner(user?.clinicUserId ?? '');
  if (practitioner.isLoading) return <PageLoadingState />;
  if (!practitioner.data || !user) return <EmptyState icon={IconPractitioner} title={t.practitioner.notFound} description={t.practitioner.notFoundDesc} />;
  return <PractitionerSelfProfile practitioner={practitioner.data} />;
}
