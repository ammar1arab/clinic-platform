"use client";

import { useCallback, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  EmailContent,
  EmailRecipientSelection,
  EmailRecipientsResponse,
  SendCustomEmailInput,
} from "@clinic/types";
import {
  emailComposerSchema,
  type EmailComposerValues,
} from "@/lib/validations";
import { useAuth, useLanguage } from "@/providers";
import { readSessionState, writeSessionState } from "../shared/use-session-storage-state";
import { extractErrorMessage, isHttpStatus } from "@/lib/api";
import { useSendEmail, useTestEmail } from "./use-emails";

export function emailSelectionFor(
  values: EmailComposerValues,
): EmailRecipientSelection {
  const term = values.search.trim();
  const patient = values.audience === "patients" && !term;
  const everyone = values.audience === "all" || Boolean(term);
  return {
    filters: {
      audience: term ? "all" : values.audience,
      ...(!everyone && values.ids.length && { ids: values.ids }),
      ...(term && { search: term }),
      ...(values.departmentId && { departmentId: values.departmentId }),
      ...(!term &&
        values.audience === "staff" &&
        values.roles.length && { roles: values.roles }),
      ...(patient && {
        ...(values.doctorId && { doctorId: values.doctorId }),
        ...(values.serviceId && { serviceId: values.serviceId }),
        ...(values.appointmentStatuses.length && {
          appointmentStatuses: values.appointmentStatuses,
        }),
        ...(values.appointmentFrom && {
          appointmentFrom: values.appointmentFrom,
        }),
        ...(values.appointmentTo && {
          appointmentTo: `${values.appointmentTo}T23:59:59.999Z`,
        }),
        ...(values.isPaid !== "all" && { isPaid: values.isPaid === "true" }),
      }),
    },
    ...(values.externalRecipients.length && {
      externalRecipients: values.externalRecipients,
    }),
    excludedEmails: [
      ...new Set(
        values.excludedEmails
          .split(/\r?\n/)
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      ),
    ],
  };
}

const contentFor = (
  { subject, body }: EmailComposerValues,
  locale: EmailContent["locale"],
): EmailContent => ({
  locale,
  subject: subject.trim(),
  body: body.trim(),
});

function recipientFilters(values: EmailComposerValues) {
  return {
    audience: values.audience,
    search: values.search,
    roles: values.roles,
    doctorId: values.doctorId,
    departmentId: values.departmentId,
    serviceId: values.serviceId,
    appointmentStatuses: values.appointmentStatuses,
    appointmentFrom: values.appointmentFrom,
    appointmentTo: values.appointmentTo,
    isPaid: values.isPaid,
  };
}

export function useEmailComposer(
  onSent: (id: string) => void,
  clinicEmail?: string,
  onTestQueued?: () => void,
) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const filterKey = `${user?.clinicUserId ?? 'none'}:email-recipient-filters`;
  const form = useForm<EmailComposerValues>({
    resolver: zodResolver(emailComposerSchema),
    defaultValues: {
      locale: lang,
      subject: "",
      body: "",
      audience: "all",
      ids: [],
      search: "",
      roles: [],
      doctorId: "",
      departmentId: "",
      serviceId: "",
      appointmentStatuses: [],
      appointmentFrom: "",
      appointmentTo: "",
      isPaid: "all",
      externalRecipients: [],
      excludedEmails: "",
    },
  });
  useWatch({
    control: form.control,
    defaultValue: form.getValues(),
  });
  const bindFilters = useCallback((node: HTMLFormElement | null) => {
    if (!node) return;
    const current = form.getValues();
    const stored = readSessionState(filterKey, recipientFilters(current));
    form.reset({ ...current, ...recipientFilters({ ...current, ...stored }) });
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => writeSessionState(filterKey, recipientFilters(values)),
    });
  }, [filterKey, form]);
  const values = form.getValues();
  const sendMutation = useSendEmail();
  const testMutation = useTestEmail();
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const busyRef = useRef(false);
  const requests = useRef<
    Partial<Record<"send" | "test", { signature: string; id: string }>>
  >({});
  const submission = useRef<{
    signature: string;
    input: SendCustomEmailInput;
  } | null>(null);

  const requestId = (kind: "send" | "test", input: object) => {
    const next = JSON.stringify(input);
    if (requests.current[kind]?.signature !== next)
      requests.current[kind] = { signature: next, id: crypto.randomUUID() };
    return requests.current[kind]!.id;
  };

  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setWorking(true);
    setError("");
    try {
      await operation();
    } catch (error) {
      setError(extractErrorMessage(error as Error));
    } finally {
      busyRef.current = false;
      setWorking(false);
    }
  };

  const send = (review: {
    selection: EmailRecipientSelection;
    recipients?: EmailRecipientsResponse;
  }) =>
    run(async () => {
      if (!(await form.trigger())) return;
      const snapshot = form.getValues();
      const selection = emailSelectionFor(snapshot);
      if (
        !review.recipients ||
        JSON.stringify(selection) !== JSON.stringify(review.selection)
      ) {
        setError(t.emails.reviewFirst);
        return;
      }
      if (!review.recipients.count) {
        setError(t.emails.noRecipients);
        return;
      }
      const payload = { ...contentFor(snapshot, lang), ...selection };
      const signature = JSON.stringify(payload);
      if (submission.current?.signature !== signature) {
        const input = {
          ...payload,
          selectionHash: review.recipients.selectionHash,
        };
        submission.current = {
          signature,
          input: { ...input, requestId: requestId("send", input) },
        };
      }
      try {
        const result = await sendMutation.mutateAsync(submission.current.input);
        onSent(result.id);
      } catch (error) {
        if (isHttpStatus(error, 409)) submission.current = null;
        throw error;
      }
    });

  const sendTest = () =>
    run(async () => {
      const content = { locale: lang };
      await testMutation.mutateAsync({
        ...content,
        requestId: requestId("test", { ...content, clinicEmail }),
      });
      delete requests.current.test;
      onTestQueued?.();
    });

  const exclude = (emails: string | string[], excluded: boolean) => {
    const existing = new Set(
      form
        .getValues("excludedEmails")
        .split(/\r?\n/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    );
    for (const email of typeof emails === "string" ? [emails] : emails) {
      if (excluded) existing.add(email);
      else existing.delete(email);
    }
    form.setValue("excludedEmails", [...existing].join("\n"), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return {
    bindFilters,
    form,
    values,
    error,
    working,
    send,
    sendTest,
    exclude,
  };
}
