"use client";

import { toast } from "sonner";
import { compressImageToJpeg } from "@/lib/upload-local";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
} from "@/components/ui";
import {
  AvatarUpload,
  FormField,
  ButtonSpinner,
} from "@/components/primitives";
import {
  useConfirmEmailChange,
  useRequestEmailChange,
  useUpdateAccountProfile,
} from "@/hooks/api/use-auth-mutations";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/lib/api";
import { useAuth, useLanguage } from "@/providers";
import type { AccountProfileInput } from "@clinic/types";
import { ROLE } from "@clinic/types";
import { AccountPasswordReset } from "./account-password-reset";
import { AccountVerificationDialog } from "./account-verification-dialog";

export function AccountProfile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const mutation = useUpdateAccountProfile();
  const emailChange = useRequestEmailChange();
  const confirmEmail = useConfirmEmailChange();
  const [emailOtp, setEmailOtp] = useState<{
    token: string;
    email: string;
    resendAt: number;
  } | null>(null);
  const [otpError, setOtpError] = useState("");
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<AccountProfileInput>({
    defaultValues: {
      email: user?.email ?? "",
      name: user?.name ?? "",
      imageUrl: user?.imageUrl ?? "",
      nameAr: user?.nameAr ?? "",
      phone: user?.phone ?? "",
    },
  });
  if (!user || user.role !== ROLE.OWNER) return null;
  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(async (values) => {
          let imageUrl = values.imageUrl;
          try {
            if (imageUrl.startsWith("blob:")) {
              const source = await fetch(imageUrl).then((response) =>
                response.blob(),
              );
              const blob = await compressImageToJpeg(source, {
                maxEdge: 256,
                maxBytes: 200_000,
              });
              imageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
              });
            }
          } catch {
            toast.error(t.common.couldNotProcessImage);
            return;
          }
          const nextEmail = values.email?.trim().toLowerCase() ?? "";
          try {
            await mutation.mutateAsync({
              ...values,
              email: user.email,
              name: values.name.trim(),
              imageUrl,
            });
            if (values.imageUrl.startsWith("blob:"))
              URL.revokeObjectURL(values.imageUrl);
            setValue("imageUrl", imageUrl);
            if (nextEmail && nextEmail !== user.email.trim().toLowerCase()) {
              const pending = await emailChange.mutateAsync(nextEmail);
              if (pending.next === "otp") {
                setOtpError("");
                setEmailOtp({
                  token: pending.token,
                  email: pending.email,
                  resendAt: Date.now() + pending.cooldownSeconds * 1000,
                });
              }
            }
          } catch {}
        })}
      >
        <fieldset
          disabled={mutation.isPending || isSubmitting}
          className="min-w-0"
        >
          <Card>
            <CardHeader>
              <CardTitle>{t.common.accountProfile}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex min-w-0 flex-col items-center gap-6">
                <AvatarUpload
                  value={watch("imageUrl")}
                  onChange={(value) => setValue("imageUrl", value)}
                  fallbackLabel={watch("name")}
                  showPreviewNotice={false}
                />
                <div className="w-full min-w-0 space-y-4">
                  <FormField
                    label={t.common.name}
                    htmlFor="account-name"
                    required
                    error={errors.name?.message}
                  >
                    <Input
                      id="account-name"
                      required
                      maxLength={120}
                      {...register("name", {
                        validate: (value) => !!value.trim() || t.common.name,
                      })}
                    />
                  </FormField>
                  <FormField
                    label={t.common.accountArabicName}
                    htmlFor="account-name-ar"
                  >
                    <Input
                      id="account-name-ar"
                      dir="rtl"
                      maxLength={120}
                      {...register("nameAr")}
                    />
                  </FormField>
                  <FormField label={t.exports.phone} htmlFor="account-phone">
                    <Input
                      id="account-phone"
                      dir="ltr"
                      type="tel"
                      maxLength={40}
                      {...register("phone")}
                    />
                  </FormField>
                  <FormField
                    label={t.common.signInEmail}
                    htmlFor="account-email"
                    hint={t.common.emailChangeHint}
                  >
                    <Input
                      id="account-email"
                      type="email"
                      required
                      maxLength={254}
                      {...register("email", { required: true })}
                      dir="ltr"
                    />
                  </FormField>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={mutation.isPending || isSubmitting}
                >
                  {(mutation.isPending || isSubmitting) && <ButtonSpinner />}
                  {t.common.save}
                </Button>
              </div>
            </CardContent>
          </Card>
        </fieldset>
      </form>
      <AccountVerificationDialog
        open={!!emailOtp}
        pending={confirmEmail.isPending}
        resendAt={emailOtp?.resendAt ?? 0}
        error={otpError}
        onClose={() => {
          setEmailOtp(null);
          setValue("email", user.email);
        }}
        onVerify={async (code) => {
          if (!emailOtp) return;
          setOtpError("");
          try {
            await confirmEmail.mutateAsync({ token: emailOtp.token, code });
            logout();
          } catch (cause) {
            setOtpError(
              extractErrorMessage(
                cause as Parameters<typeof extractErrorMessage>[0],
              ),
            );
          }
        }}
        onResend={async () => {
          if (!emailOtp) return;
          setOtpError("");
          try {
            const pending = await authService.resendEmailChange(emailOtp.token);
            if (pending.next !== "otp") return;
            setEmailOtp({
              token: pending.token,
              email: pending.email,
              resendAt: Date.now() + pending.cooldownSeconds * 1000,
            });
          } catch (cause) {
            setOtpError(
              extractErrorMessage(
                cause as Parameters<typeof extractErrorMessage>[0],
              ),
            );
          }
        }}
      />
      <AccountPasswordReset id={user.clinicUserId} />
    </div>
  );
}
