"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EmailSettingsInput } from "@clinic/types";
import { ROLE } from "@clinic/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@/components/ui";
import {
  ButtonSpinner,
  ErrorState,
  FormField,
  FormPageSkeleton,
} from "@/components/primitives";
import { useEmailSettings, useSaveEmailSettings } from "@/hooks/api/use-emails";
import { useClinic } from "@/hooks/api/use-clinic";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useAuth, useLanguage } from "@/providers";
import {
  emailSettingsSchema,
  type EmailSettingsValues,
} from "@/lib/validations";
import { extractErrorMessage } from "@/lib/api";
import { httpsUrl } from "@/lib/contact";
import { ROUTES } from "@/constants/routes";
import { SettingsPageBack } from "@/components/blocks/settings/settings-navigation";

function EmailSettingsForm({
  settings,
  editable,
}: {
  settings: EmailSettingsInput;
  editable: boolean;
}) {
  const { t } = useLanguage();
  const mutation = useSaveEmailSettings();
  const clinicId = useClinicId();
  const clinic = useClinic(clinicId);
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      replyTo: settings.replyTo ?? "",
      websiteUrl: settings.websiteUrl ?? "",
      instagramUrl: settings.instagramUrl ?? "",
      facebookUrl: settings.facebookUrl ?? "",
      linkedinUrl: settings.linkedinUrl ?? "",
      footerEn: settings.footerEn ?? "",
      footerAr: settings.footerAr ?? "",
    },
  });
  const submit = handleSubmit(async (values) => {
    if (!editable || mutation.isPending) return;
    const input: EmailSettingsInput = {
      ...values,
      replyTo: values.replyTo || undefined,
      websiteUrl: httpsUrl(values.websiteUrl),
      instagramUrl: httpsUrl(values.instagramUrl),
      facebookUrl: httpsUrl(values.facebookUrl),
      linkedinUrl: httpsUrl(values.linkedinUrl),
      footerEn: values.footerEn || undefined,
      footerAr: values.footerAr || undefined,
    };
    try {
      await mutation.mutateAsync(input);
    } catch {}
  });
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset
        disabled={!editable || mutation.isPending || isSubmitting}
        className="min-w-0"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.emails.settings}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={t.emails.replyTo}
              htmlFor="replyTo"
              error={errors.replyTo?.message}
              className="sm:col-span-2"
            >
              <Input
                id="replyTo"
                placeholder={clinic.data?.email ?? ""}
                type="email"
                dir="ltr"
                maxLength={254}
                {...register("replyTo", {
                  onBlur: () => void trigger("replyTo"),
                })}
              />
            </FormField>
            {(
              [
                "websiteUrl",
                "instagramUrl",
                "facebookUrl",
                "linkedinUrl",
              ] as const
            ).map((name) => {
              const field = register(name);
              return (
                <FormField
                  key={name}
                  label={t.emails[name]}
                  htmlFor={name}
                  error={errors[name]?.message}
                >
                  <Input
                    id={name}
                    type="text"
                    dir="ltr"
                    maxLength={2048}
                    {...field}
                    onBlur={(event) => {
                      const next = httpsUrl(event.target.value);
                      if (next) {
                        setValue(name, next, {
                          shouldDirty: true,
                          shouldValidate: true,
                          shouldTouch: true,
                        });
                        return;
                      }
                      void field.onBlur(event);
                    }}
                  />
                </FormField>
              );
            })}
            {(["footerEn", "footerAr"] as const).map((name) => (
              <FormField
                key={name}
                label={t.emails[name]}
                htmlFor={name}
                error={errors[name]?.message}
              >
                <Textarea
                  id={name}
                  rows={4}
                  dir={name === "footerAr" ? "rtl" : "ltr"}
                  maxLength={1000}
                  {...register(name)}
                />
              </FormField>
            ))}
          </CardContent>
        </Card>
      </fieldset>
      {!editable && (
        <p className="text-sm text-muted-foreground">{t.emails.ownerOnly}</p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {extractErrorMessage(mutation.error)}
        </p>
      )}
      {editable && (
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || isSubmitting}>
            {(mutation.isPending || isSubmitting) && <ButtonSpinner />}
            {t.common.save}
          </Button>
        </div>
      )}
    </form>
  );
}

export function EmailSettings() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const settings = useEmailSettings(clinicId);
  return (
    <div className="w-full min-w-0 space-y-4">
      <SettingsPageBack backHref={ROUTES.EMAILS} />
      {settings.isLoading && <FormPageSkeleton />}
      {settings.isError && (
        <ErrorState onRetry={() => void settings.refetch()} />
      )}
      {settings.data && (
        <EmailSettingsForm
          key={clinicId}
          settings={settings.data}
          editable={user?.role === ROLE.OWNER}
        />
      )}
    </div>
  );
}
