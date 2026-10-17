"use client";

import { AccountProfile } from "@/components/blocks/auth/account-profile";
import { PractitionerSelfProfile } from "@/components/blocks/practitioners";
import { EmptyState, ErrorState, FormPageSkeleton } from "@/components/primitives";
import { IconPractitioner } from "@/constants/icons";
import { usePractitioner } from "@/hooks/api/use-practitioners";
import { ROLE } from "@clinic/types";
import { useAuth, useLanguage } from "@/providers";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return <FormPageSkeleton />;
  if (user.role === ROLE.PRACTITIONER) return <PractitionerProfilePage id={user.clinicUserId} />;
  return (
    <div className="page-stack space-y-4">
      <AccountProfile key={user.clinicUserId} />
    </div>
  );
}

function PractitionerProfilePage({ id }: { id: string }) {
  const { t } = useLanguage();
  const { data: practitioner, isLoading, isError, refetch } = usePractitioner(id);

  if (isLoading) return <FormPageSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!practitioner) {
    return <EmptyState icon={IconPractitioner} title={t.practitioner.practitionerNotFound} description={t.practitioner.practitionerNotFoundDesc} />;
  }
  return <PractitionerSelfProfile practitioner={practitioner} />;
}
