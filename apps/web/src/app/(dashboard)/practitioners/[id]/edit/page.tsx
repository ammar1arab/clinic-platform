'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBack } from '@/components/primitives/page-back';
import { EmptyState } from '@/components/primitives/empty-state';
import { PractitionerForm } from '@/components/blocks/practitioners/practitioner-form';
import { IconPractitioner } from '@/constants/icons';
import { useClinicId } from '@/hooks/use-clinic-id';
import { usePractitioner } from '@/hooks/use-practitioners';
import { ROUTES } from '@/constants/routes';

export default function EditPractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const router = useRouter();
  const { data, isLoading, isError } = usePractitioner(id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageBack
        backHref={ROUTES.PRACTITIONER_DETAIL(id)}
        backLabel="Back to profile"
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : isError || !data ? (
        <EmptyState
          icon={IconPractitioner}
          title="Practitioner not found"
          description="This practitioner may have been removed."
        />
      ) : (
        <PractitionerForm
          clinicId={clinicId}
          practitioner={data}
          onCancel={() => router.push(ROUTES.PRACTITIONER_DETAIL(id))}
          onSuccess={(savedId) => router.push(ROUTES.PRACTITIONER_DETAIL(savedId))}
        />
      )}
    </div>
  );
}
