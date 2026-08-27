'use client';

import { useRouter } from 'next/navigation';
import { PageBack } from '@/components/primitives/page-back';
import { PractitionerForm } from '@/components/blocks/practitioners/practitioner-form';
import { useClinicId } from '@/hooks/use-clinic-id';
import { ROUTES } from '@/constants/routes';

export default function NewPractitionerPage() {
  const clinicId = useClinicId();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageBack backHref={ROUTES.PRACTITIONERS} backLabel="Back to Practitioners" />
      <PractitionerForm
        clinicId={clinicId}
        onCancel={() => router.push(ROUTES.PRACTITIONERS)}
        onSuccess={(id) => router.push(ROUTES.PRACTITIONER_DETAIL(id))}
      />
    </div>
  );
}
