"use client";

import { AccountProfile } from "@/components/blocks/auth/account-profile";
import { FormPageSkeleton } from "@/components/primitives";
import { useAuth } from "@/providers";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return <FormPageSkeleton />;
  return (
    <div className="page-stack space-y-4">
      <AccountProfile key={user.clinicUserId} />
    </div>
  );
}
