"use client";

import {
  FormField,
  SearchablePicker,
  ErrorState,
  IconCard,
} from "@/components/primitives";
import { getStaffName } from "@/i18n";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useClinicStaff } from "@/hooks/api/use-clinic-staff";
import { useState } from "react";
import { ROLE } from "@clinic/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import { useAuth, useLanguage } from "@/providers";
import { useOwnerResetPassword } from "@/hooks/api/use-auth-mutations";
import { extractErrorMessage } from "@/lib/api";
import { PasswordForm } from "@/components/blocks/auth/password-form";
import { IconKey } from "@/constants/icons";

export function AccountPasswordReset({ id }: { id?: string }) {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();
  const clinicId = useClinicId();
  const staff = useClinicStaff(user?.role === ROLE.OWNER ? clinicId : "");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const targetId = id ?? selectedId;
  const mutation = useOwnerResetPassword(targetId);
  const [revision, setRevision] = useState(0);
  if (user?.role !== ROLE.OWNER) return null;

  const save = async (password: string) => {
    if (!targetId) return;
    try {
      await mutation.mutateAsync({ password });
      setRevision((value) => value + 1);
      setSelectedId("");
      setOpen(false);
      if (targetId === user.clinicUserId) logout();
    } catch {}
  };

  const picker = !id ? (
    <fieldset
      disabled={mutation.isPending || staff.isLoading}
      className="min-w-0"
    >
      <FormField>
        <SearchablePicker
          value={selectedId}
          options={(staff.data ?? []).map((member) => ({
            value: member.id,
            label: `${getStaffName(member, lang)}${member.email ? ` - ${member.email}` : ""}`,
          }))}
          placeholder={t.common.chooseAccount}
          searchPlaceholder={t.common.chooseAccount}
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
  ) : null;

  const fields = (
    <>
      {picker}
      <PasswordForm
        key={`${targetId}-${revision}`}
        autoFocus={false}
        pending={mutation.isPending}
        disabled={!targetId}
        onSubmit={save}
      />
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {extractErrorMessage(mutation.error)}
        </p>
      )}
    </>
  );

  if (!id) {
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (mutation.isPending) return;
          setOpen(next);
          if (!next) {
            setSelectedId("");
            mutation.reset();
          }
        }}
      >
        <DialogTrigger asChild>
          <IconCard
            icon={IconKey}
            title={t.common.resetAccountPassword}
            description={t.common.resetAccountPasswordDesc}
            accent="warning"
          />
        </DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{t.common.resetAccountPassword}</DialogTitle>
          <div className="space-y-4">{fields}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.common.resetAccountPassword}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{fields}</CardContent>
    </Card>
  );
}
