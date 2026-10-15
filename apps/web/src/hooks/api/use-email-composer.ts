"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  EmailContent,
  EmailRecipientSelection,
  EmailRecipientsResponse,
  SendCustomEmailInput,
} from "@clinic/types";
import {
  emailComposerSchema,
  emailContentSchema,
  type EmailComposerValues,
} from "@/lib/validations";
import { useLanguage } from "@/providers";
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

export function useEmailComposer(
  onSent: (id: string) => void,
  clinicEmail?: string,
) {
  const { t, lang } = useLanguage();
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
  const values = form.watch();
  const sendMutation = useSendEmail();
  const testMutation = useTestEmail();
  const [error, setError] = useState("");
  const [testId, setTestId] = useState<string>();
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

  const validateContent = () => {
    const result = emailContentSchema.safeParse({
      ...form.getValues(),
      locale: lang,
    });
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (key === "subject" || key === "body" || key === "locale")
          form.setError(key, { message: issue.message });
      });
      return undefined;
    }
    form.clearErrors(["subject", "body", "locale"]);
    return result.data;
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
      const content = validateContent();
      if (!content) return;
      const result = await testMutation.mutateAsync({
        ...content,
        requestId: requestId("test", { ...content, clinicEmail }),
      });
      delete requests.current.test;
      setTestId(result.id);
    });

  const exclude = (email: string, excluded: boolean) => {
    const existing = new Set(
      form
        .getValues("excludedEmails")
        .split(/\r?\n/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    );
    if (excluded) existing.add(email);
    else existing.delete(email);
    form.setValue("excludedEmails", [...existing].join("\n"), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return {
    form,
    values,
    error,
    testId,
    working,
    send,
    sendTest,
    exclude,
  };
}
