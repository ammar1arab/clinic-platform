"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { compressImageToJpeg } from "@/lib/upload-local";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import {
  AvatarUpload,
  FormField,
  FormActions,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileShell,
  ReadOnlyMark,
} from "@/components/primitives";
import { IconEdit } from "@/constants/icons";
import { useUpdateAccountProfile } from "@/hooks/api/use-auth-mutations";
import { useAuth, useLanguage } from "@/providers";
import type { AccountProfileInput } from "@clinic/types";
import { ROLE } from "@clinic/types";
import { ROUTES } from "@/constants/routes";
import { AccountPasswordReset } from "./account-password-reset";

function LockedField({ label, value, readOnlyLabel }: { label: string; value: string; readOnlyLabel: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <ReadOnlyMark label={readOnlyLabel} />
      </div>
      <p className="mt-1.5 break-words text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export function AccountProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const mutation = useUpdateAccountProfile();
  const { register, control, setValue, reset, handleSubmit, formState: { isSubmitting, errors } } = useForm<AccountProfileInput>({
    defaultValues: {
      name: user?.name ?? "",
      imageUrl: user?.imageUrl ?? "",
      nameAr: user?.nameAr ?? "",
      phone: user?.phone ?? "",
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
      reset({ name: values.name.trim(), nameAr: values.nameAr ?? "", phone: values.phone ?? "", imageUrl: nextImage });
      setEditing(false);
    } catch {
      toast.error(t.common.couldNotProcessImage);
    }
  };

  const cancel = () => {
    reset({ name: user.name ?? "", nameAr: user.nameAr ?? "", phone: user.phone ?? "", imageUrl: user.imageUrl ?? "" });
    setEditing(false);
  };

  return (
    <ProfileShell
      backHref={ROUTES.DASHBOARD}
      backLabel={t.layout.sidebar.dashboard}
      actions={!editing ? (
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          <IconEdit className="size-3.5" />{t.common.edit}
        </Button>
      ) : undefined}
    >
      <Card className="card-aura overflow-hidden ring-0">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <AvatarUpload value={editing ? imageUrl : user.imageUrl} onChange={(value) => setValue("imageUrl", value)} fallbackLabel={editing ? name : user.name} showPreviewNotice={false} disabled={!editing} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">{user.name}</h1>
              <Badge variant="success">{t.common.active}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t.common.accountProfile}</p>
            <p className="break-words text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <form onSubmit={handleSubmit(save)}>
          <fieldset disabled={mutation.isPending || isSubmitting} className="min-w-0">
            <ProfileSection title={t.common.accountProfile} description={t.common.signInEmailHint}>
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
                <LockedField label={t.common.signInEmail} value={user.email} readOnlyLabel={t.common.readOnly} />
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
            <ProfileInfoField label={t.exports.phone} value={user.phone} dir="ltr" />
            <ProfileInfoField label={t.common.signInEmail} value={user.email} />
          </ProfileInfoGrid>
        </ProfileSection>
      )}

      <AccountPasswordReset id={user.clinicUserId} />
    </ProfileShell>
  );
}
