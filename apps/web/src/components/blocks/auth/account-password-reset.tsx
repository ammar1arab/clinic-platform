"use client";

import {
  FormField,
  SearchablePicker,
  ErrorState,
} from "@/components/primitives";
import { getStaffName } from "@/i18n";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useClinicStaff } from "@/hooks/api/use-clinic-staff";
import { useState } from "react";
import { ROLE } from "@clinic/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuth, useLanguage } from "@/providers";
import { useOwnerResetPassword } from "@/hooks/api/use-auth-mutations";
import { extractErrorMessage } from "@/lib/api";
import { PasswordForm } from "@/components/blocks/auth/password-form";

export function AccountPasswordReset({ id }: { id?: string }) {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();
  const clinicId = useClinicId();
  const staff = useClinicStaff(user?.role === ROLE.OWNER ? clinicId : "");
  const [selectedId, setSelectedId] = useState("");
  const targetId = id ?? selectedId;
  const mutation = useOwnerResetPassword(targetId);
  const [revision, setRevision] = useState(0);
  if (user?.role !== ROLE.OWNER) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.common.resetAccountPassword}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t.common.resetAccountPasswordHint}
        </p>
        {!id && (
          <fieldset
            disabled={mutation.isPending || staff.isLoading}
            className="min-w-0"
          >
            <FormField label={t.common.accountUser}>
              <SearchablePicker
                value={selectedId}
                options={(staff.data ?? []).map((member) => ({
                  value: member.id,
                  label: getStaffName(member, lang),
                }))}
                placeholder={t.common.accountUser}
                searchPlaceholder={t.common.search}
                onChange={(value) => {
                  if (mutation.isPending) return;
                  setSelectedId(value);
                  mutation.reset();
                }}
              />
              {staff.isError && (
                <ErrorState onRetry={() => void staff.refetch()} />
              )}
            </FormField>
          </fieldset>
        )}
        {targetId && (
          <PasswordForm
            key={`${targetId}-${revision}`}
            autoFocus={false}
            pending={mutation.isPending}
            onSubmit={async (password) => {
              try {
                await mutation.mutateAsync({ password });
                setRevision((value) => value + 1);
                if (targetId === user.clinicUserId) logout();
              } catch {}
            }}
          />
        )}
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {extractErrorMessage(mutation.error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
