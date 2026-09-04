'use client';

import { useRouter } from 'next/navigation';
import { PageBack } from '@/components/primitives';
import { PractitionerForm } from '@/components/blocks/practitioners';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/providers';

export default function NewPractitionerPage() {
  const clinicId = useClinicId();
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack backHref={ROUTES.PRACTITIONERS} backLabel={t.practitioner.backToPractitioners} />
      <PractitionerForm
        clinicId={clinicId}
        onCancel={() => router.push(ROUTES.PRACTITIONERS)}
        onSuccess={(id) => router.push(ROUTES.PRACTITIONER_DETAIL(id))}
      />
    </div>
  );
}
