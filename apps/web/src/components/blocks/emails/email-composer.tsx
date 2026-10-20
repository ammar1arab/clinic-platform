"use client";

import { useCallback, useDeferredValue, useRef } from "react";
import { prepareFeedbackSound } from "@/lib/feedback-sound";
import { useFeedbackOverlay } from "@/hooks/shared/use-feedback-overlay";
import { FormProvider } from "react-hook-form";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from "@/components/ui";
import {
  ButtonSpinner,
  ErrorState,
  FormField,
  PageBack,
  TableSkeleton,
  SoftTip,
  OverflowActions,
} from "@/components/primitives";
import {
  emailSelectionFor,
  useEmailComposer,
} from "@/hooks/api/use-email-composer";
import { useClinic } from "@/hooks/api/use-clinic";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import {
  useEmailPreviewQuery,
  useEmailRecipientQuery,
  useEmailVariables,
  useEmailSettings,
} from "@/hooks/api/use-emails";
import { useRouteNav } from "@/hooks/shared/use-route-nav";
import { IconSend } from "@/constants/icons";
import { useLanguage } from "@/providers";
import { ROUTES } from "@/constants/routes";
import { EmailRecipientFields } from "./email-recipient-fields";
import { EmailRecipientList } from "./email-recipient-list";
import { EmailPreviewPane } from "./email-display";
import {
  EmailBodyEditor,
  type EmailBodyEditorHandle,
} from "./email-body-editor";

export function EmailComposer() {
  const { t, lang, dir } = useLanguage();
  const nav = useRouteNav();
  const clinicId = useClinicId();
  const clinic = useClinic(clinicId);
  const settings = useEmailSettings(clinicId);
  const clinicEmail =
    settings.data?.replyTo?.trim() || clinic.data?.email?.trim();
  const sentId = useRef<string | null>(null);
  const feedback = useFeedbackOverlay(() => {
    if (sentId.current) nav.go(ROUTES.EMAIL_DETAIL(sentId.current));
  });
  const state = useEmailComposer(
    (id) => {
      sentId.current = id;
      feedback.celebrate(t.emails.queuedSuccess);
    },
    clinicEmail,
    () => {
      sentId.current = null;
      feedback.celebrate(t.emails.testQueued);
    },
  );
  const { form, values } = state;
  const variables = useEmailVariables(clinicId);
  const { errors } = form.formState;
  const excluded = (values.excludedEmails ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const deferredValues = useDeferredValue(values);
  const selection = emailSelectionFor(deferredValues);
  const recipientsLoading =
    JSON.stringify(emailSelectionFor(values)) !== JSON.stringify(selection);
  const recipientsQuery = useEmailRecipientQuery(selection, true);
  const audiencePending =
    JSON.stringify({
      ...emailSelectionFor(values),
      excludedEmails: undefined,
    }) !== JSON.stringify({ ...selection, excludedEmails: undefined });
  const selectedCount =
    recipientsQuery.displayData?.recipients.filter(
      (recipient) => !excluded.includes(recipient.email),
    ).length ?? 0;
  const countPending =
    recipientsLoading ||
    recipientsQuery.isFetching ||
    recipientsQuery.isPlaceholderData;
  const testLabel =
    settings.isLoading || clinic.isLoading
      ? t.common.loading
      : settings.isError || clinic.isError
        ? t.common.somethingWentWrong
        : clinicEmail
          ? t.emails.testDestination.replace("{email}", clinicEmail)
          : t.emails.testHint;
  const previewSubject = deferredValues.subject.trim();
  const previewBody = deferredValues.body.trim();
  const canPreview = Boolean(previewSubject && previewBody);
  const previewPerson = recipientsQuery.data?.recipients[0];
  const previewQuery = useEmailPreviewQuery(
    {
      locale: lang,
      subject: previewSubject,
      body: previewBody,
      ...(previewPerson
        ? previewPerson.sourceId && previewPerson.audience !== "external"
          ? {
              recipient: {
                audience: previewPerson.audience,
                id: previewPerson.sourceId,
              },
            }
          : {
              externalRecipient: {
                email: previewPerson.email,
                name: previewPerson.name,
              },
            }
        : {}),
    },
    canPreview,
  );
  const bodyRef = useRef<EmailBodyEditorHandle>(null);
  const labelFor = useCallback(
    (key: string) => {
      const labels = t.emails.variableLabels;
      return key in labels ? labels[key as keyof typeof labels] : key;
    },
    [t],
  );
  return (
    <div className="page-fill gap-4 pb-2">
      <PageBack
        className="shrink-0"
        backHref={ROUTES.EMAILS}
        actions={
          <div className="flex items-center gap-2">
            <SoftTip
              label={
                countPending
                  ? t.common.loading
                  : `${selectedCount} ${t.emails.recipients}`
              }
            >
              <Badge
                variant="default"
                className="h-8 min-w-8 justify-center rounded-full px-2 tabular-nums"
                aria-label={
                  countPending
                    ? t.common.loading
                    : `${selectedCount} ${t.emails.recipients}`
                }
              >
                {countPending ? (
                  <ButtonSpinner className="me-0 size-3.5" />
                ) : recipientsQuery.isError ? (
                  "-"
                ) : (
                  selectedCount
                )}
              </Badge>
            </SoftTip>
            <SoftTip label={testLabel}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={testLabel}
                disabled={
                  state.working ||
                  feedback.open ||
                  !clinicEmail ||
                  settings.isLoading ||
                  clinic.isLoading ||
                  settings.isError ||
                  clinic.isError
                }
                onClick={() => {
                  prepareFeedbackSound();
                  void state.sendTest();
                }}
              >
                <IconSend className="size-4" />
              </Button>
            </SoftTip>
            <Button
              type="submit"
              form="email-composer-form"
              disabled={
                state.working ||
                feedback.open ||
                countPending ||
                recipientsQuery.isError ||
                !selectedCount
              }
            >
              {state.working && <ButtonSpinner />}
              {t.emails.confirmSend}
            </Button>
          </div>
        }
      />
      <FormProvider {...form}>
        <form
          id="email-composer-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!feedback.open && !countPending && !recipientsQuery.isError) {
              void state.send({ selection, recipients: recipientsQuery.data });
            }
          }}
          className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain lg:[container-type:size]"
        >
          <fieldset
            disabled={state.working || feedback.open}
            className="m-0 grid items-start gap-4 border-0 p-0 disabled:opacity-70 lg:grid-cols-[minmax(0,7fr)_minmax(0,13fr)]"
            dir="ltr"
          >
            <div className="min-w-0 self-start lg:sticky lg:top-0.5">
              <EmailPreviewPane
                dir={dir}
                empty={!canPreview}
                emptyTitle={t.emails.previewEmpty}
                error={canPreview && previewQuery.isError}
                loading={
                  canPreview && !previewQuery.data && !previewQuery.isError
                }
                preview={previewQuery.data}
                onRetry={() => void previewQuery.refetch()}
              />
            </div>
            <div
              className="order-first flex min-w-0 flex-col gap-4 lg:order-none"
              dir={dir}
            >
              <div className="flex min-w-0 flex-col gap-4">
                <Card className="shrink-0">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t.emails.content}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      label={t.emails.subject}
                      htmlFor="email-subject"
                      required
                      error={errors.subject?.message}
                    >
                      <Input
                        id="email-subject"
                        {...form.register("subject")}
                        maxLength={200}
                      />
                    </FormField>
                    <FormField
                      label={t.emails.body}
                      htmlFor="email-body"
                      required
                      error={errors.body?.message}
                    >
                      <EmailBodyEditor
                        ref={bodyRef}
                        id="email-body"
                        value={values.body}
                        disabled={state.working}
                        labelFor={labelFor}
                        onChange={(next) =>
                          form.setValue("body", next, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </FormField>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t.emails.variables}
                      </p>
                      {variables.isError && (
                        <ErrorState onRetry={() => void variables.refetch()} />
                      )}
                      <OverflowActions label={t.emails.variables}>
                        {variables.isLoading
                          ? [
                              "w-24",
                              "w-28",
                              "w-16",
                              "w-24",
                              "w-28",
                              "w-24",
                            ].map((width, index) => (
                              <Skeleton
                                key={index}
                                className={`h-8 shrink-0 ${width} rounded-md`}
                              />
                            ))
                          : (variables.data?.variables ?? []).map(
                              (variable) => (
                                <Button
                                  key={variable}
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() =>
                                    bodyRef.current?.insert(variable)
                                  }
                                >
                                  {labelFor(variable)}
                                </Button>
                              ),
                            )}
                      </OverflowActions>
                    </div>
                  </CardContent>
                </Card>
                <EmailRecipientFields
                  searchLoading={
                    recipientsLoading ||
                    recipientsQuery.isLoading ||
                    recipientsQuery.isPlaceholderData
                  }
                />
                {(settings.isError || clinic.isError) && (
                  <ErrorState
                    onRetry={() => {
                      void settings.refetch();
                      void clinic.refetch();
                    }}
                  />
                )}
                {state.error && (
                  <ErrorState title={state.error} className="py-6" />
                )}
              </div>
              <div dir={dir} className="lg:sticky lg:top-0.5 lg:h-[calc(100cqh-4px)]">
                {recipientsQuery.isError && (
                  <ErrorState onRetry={() => void recipientsQuery.refetch()} />
                )}
                {audiencePending || !recipientsQuery.displayData ? (
                  !recipientsQuery.isError && (
                    <TableSkeleton rows={8} cols={3} hasHeader={false} />
                  )
                ) : (
                  <EmailRecipientList
                    recipients={recipientsQuery.displayData.recipients}
                    excluded={excluded}
                    onExclude={state.exclude}
                    onExcludeMany={(emails) => state.exclude(emails, true)}
                    disabled={state.working}
                  />
                )}
              </div>
            </div>
          </fieldset>
        </form>
      </FormProvider>
      {feedback.overlay}
    </div>
  );
}
