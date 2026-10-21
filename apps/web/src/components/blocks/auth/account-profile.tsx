"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { compressImageToJpeg } from "@/lib/upload-local";
import { Button, Card, CardContent, Input } from "@/components/ui";
import {
  AvatarUpload,
  SensitiveInput,
  EmailLink,
  FormField,
  FormActions,
  PhoneLink,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileShell,
} from "@/components/primitives";
import { IconEdit } from "@/constants/icons";
import { useRequestEmailChange, useConfirmEmailChange, useUpdateAccountProfile } from "@/hooks/api/use-auth-mutations";
import { useAuth, useLanguage } from "@/providers";
import { useClinic } from "@/hooks/api/use-clinic";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import type { AccountProfileInput } from "@clinic/types";
import { ROLE } from "@clinic/types";
import { ROUTES } from "@/constants/routes";
import { getBilingualName } from "@/i18n";
import { formatDateTime } from "@/lib/datetime";
import { extractErrorMessage } from "@/lib/api";
import { AccountVerificationDialog } from "./account-verification-dialog";
import { AccountPasswordReset } from "./account-password-reset";

export function AccountProfile() {
  const { user, logout } = useAuth();
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const mutation = useUpdateAccountProfile();
  const emailChange = useRequestEmailChange();
  const confirmEmail = useConfirmEmailChange();
  const [challenge, setChallenge] = useState<{ token: string; email: string; resendAt: number } | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const requestEmail = async (email: string) => {
    const response = await emailChange.mutateAsync(email);
    if (response.next === "otp") setChallenge({ token: response.token, email: response.email, resendAt: new Date().getTime() + response.cooldownSeconds * 1000 });
  };
  const { register, control, setValue, reset, handleSubmit, formState: { isSubmitting, errors } } = useForm<AccountProfileInput>({
    defaultValues: {
      name: user?.name ?? "",
      imageUrl: user?.imageUrl ?? "",
      nameAr: user?.nameAr ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
    },
  });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const name = useWatch({ control, name: "name" });

  if (!user || user.role !== ROLE.OWNER) return null;

  const save = async (values: AccountProfileInput) => {
    let nextImage = values.imageUrl ?? "";
    try {
      if (nextImage.startsWith("blob:")) {
        const source = await fetch(nextImage).then((response) => response.blob());
        const blob = await compressImageToJpeg(source, { maxEdge: 256, maxBytes: 200_000 });
        nextImage = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      }
      await mutation.mutateAsync({
        ...values,
        email: user.email,
        name: values.name.trim(),
        imageUrl: nextImage,
      });
      if (values.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(values.imageUrl);
      reset({ email: values.email ?? user.email, name: values.name.trim(), nameAr: values.nameAr ?? "", phone: values.phone ?? "", imageUrl: nextImage });
      setEditing(false);
      if (values.email && values.email.trim().toLowerCase() !== user.email) await requestEmail(values.email.trim().toLowerCase());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    }
  };

  const cancel = () => {
    reset({ email: user.email, name: user.name ?? "", nameAr: user.nameAr ?? "", phone: user.phone ?? "", imageUrl: user.imageUrl ?? "" });
    setEditing(false);
  };

  return (
    <ProfileShell
      backHref={ROUTES.DASHBOARD}
      actions={!editing ? (
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          <IconEdit className="size-3.5" />{t.common.edit}
        </Button>
      ) : undefined}
    >
      <Card className="card-aura overflow-hidden ring-0">
        <CardContent className="flex flex-row items-center gap-3 p-4 sm:gap-5 sm:p-5">
          <AvatarUpload className="shrink-0" value={editing ? imageUrl : user.imageUrl} onChange={(value) => setValue("imageUrl", value)} fallbackLabel={editing ? name : user.name} showPreviewNotice={false} disabled={!editing} />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 dir="auto" className="truncate text-start font-heading text-base font-semibold tracking-tight sm:text-lg">{getBilingualName(user.name, user.nameAr, lang)}</h1>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground sm:text-sm">
              <span className="font-medium">{t.common.lastSignIn}</span>
              <span dir="ltr">{formatDateTime(user.lastSignInAt, t.common.notRecorded, lang)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <form onSubmit={handleSubmit(save)}>
          <fieldset disabled={mutation.isPending || isSubmitting} className="min-w-0">
            <ProfileSection title={t.common.accountProfile}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t.common.name} htmlFor="account-name" required error={errors.name?.message}>
                  <Input id="account-name" maxLength={120} {...register("name", { required: t.validation.required })} />
                </FormField>
                <FormField label={t.common.accountArabicName} htmlFor="account-name-ar">
                  <Input id="account-name-ar" dir="rtl" maxLength={120} {...register("nameAr")} />
                </FormField>
                <FormField label={t.exports.phone} htmlFor="account-phone">
                  <Input id="account-phone" dir="ltr" type="tel" maxLength={40} {...register("phone")} />
                </FormField>
                <FormField label={t.common.signInEmail} htmlFor="account-email" required error={errors.email?.message}>
                  <SensitiveInput id="account-email" dir="ltr" type="email" maxLength={254} {...register("email", { required: t.validation.required })} />
                </FormField>
              </div>
              <FormActions className="mt-5" onCancel={cancel} submitLabel={t.common.save} pending={mutation.isPending || isSubmitting} />
            </ProfileSection>
          </fieldset>
        </form>
      ) : (
        <ProfileSection title={t.common.accountProfile}>
          <ProfileInfoGrid className="lg:grid-cols-3">
            <ProfileInfoField label={t.common.name} value={user.name} />
            <ProfileInfoField label={t.common.accountArabicName} value={user.nameAr} dir="rtl" />
            <ProfileInfoField label={t.exports.phone} value={user.phone} dir="ltr">
              <PhoneLink value={user.phone} copyable className="text-sm font-medium" />
            </ProfileInfoField>
            <ProfileInfoField label={t.common.signInEmail} value={user.email}>
              <EmailLink value={user.email} copyable className="text-sm font-medium" />
            </ProfileInfoField>
          </ProfileInfoGrid>
        </ProfileSection>
      )}

      {clinic ? (
        <ProfileSection title={t.common.clinicDetails}>
          <ProfileInfoGrid className="lg:grid-cols-3">
            <ProfileInfoField label={t.common.clinicEmail} value={clinic.email} dir="ltr">
              <EmailLink value={clinic.email} copyable className="text-sm font-medium" />
            </ProfileInfoField>
            <ProfileInfoField label={t.exports.phone} value={clinic.phone} dir="ltr">
              <PhoneLink value={clinic.phone} copyable className="text-sm font-medium" />
            </ProfileInfoField>
            <ProfileInfoField label={t.common.clinicAddressLabel} value={clinic.address} />
            <ProfileInfoField label={t.common.clinicTimezone} value={clinic.timezone} dir="ltr" />
            <ProfileInfoField label={t.common.clinicWorkingHours} value={`${clinic.workingHoursStart} - ${clinic.workingHoursEnd}`} dir="ltr" />
          </ProfileInfoGrid>
        </ProfileSection>
      ) : null}

      <AccountPasswordReset id={user.clinicUserId} />
      <AccountVerificationDialog open={!!challenge} pending={confirmEmail.isPending || emailChange.isPending} email={challenge?.email} resendAt={challenge?.resendAt ?? 0} error={verificationError}
        onClose={() => { setChallenge(null); setVerificationError(""); }}
        onResend={async () => { if (challenge) await requestEmail(challenge.email); }}
        onVerify={async (code) => {
          if (!challenge) return;
          try {
            await confirmEmail.mutateAsync({ token: challenge.token, code });
            setChallenge(null);
            await logout();
          } catch (error) { setVerificationError(extractErrorMessage(error instanceof Error ? error : { message: t.errors.generic })); }
        }}
      />
    </ProfileShell>
  );
}
