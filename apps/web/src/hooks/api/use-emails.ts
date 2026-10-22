import { DEFAULT_PAGE_SIZE } from '@/components/primitives/display/pagination';
import { useState } from "react";
import type {
  EmailAudiencesResponse,
  EmailHistoryInput,
  EmailHistoryResponse,
  EmailMessageDetail,
  EmailPreviewInput,
  EmailPreviewResponse,
  EmailRecipientSelection,
  EmailRecipientsResponse,
  EmailSettingsInput,
  EmailTestInput,
  EmailVariablesResponse,
  SendCustomEmailInput,
} from "@clinic/types";
import { emailsService } from "@/services/emails.service";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useLanguage } from "@/providers";
import { useApiMutation, useFetchData } from "../query";
import type { TResponseError } from "../query";
import { useClinic } from "./use-clinic";
import { useClinicId } from "../shared/use-clinic-id";
import { useQueryClient } from "@tanstack/react-query";
import { isHttpStatus } from "@/lib/api";

export function useEmailHistory(
  clinicId: string,
  filters: EmailHistoryInput,
  enabled = true,
) {
  const { lang } = useLanguage();
  return useFetchData<EmailHistoryResponse>({
    queryKey: QUERY_KEYS.emails.history(clinicId, lang, filters),
    request: () => emailsService.history(filters),
    options: {
      enabled: !!clinicId && enabled,
      refetchInterval: 15000,
      keepPreviousData: true,
    },
  });
}

export function useEmailMessage(clinicId: string, id: string, page: number) {
  const { lang } = useLanguage();
  const { data: clinic } = useClinic(clinicId);
  const brandStamp = clinic?.updatedAt ?? "";
  return useFetchData<EmailMessageDetail>({
    queryKey: QUERY_KEYS.emails.detail(clinicId, lang, id, page, brandStamp),
    request: () => emailsService.detail(id, { page, limit: DEFAULT_PAGE_SIZE }),
    options: {
      enabled: !!clinicId && !!id,
      refetchInterval: 10000,
      keepPreviousData: true,
    },
  });
}

export function useEmailSettings(clinicId: string) {
  return useFetchData<EmailSettingsInput>({
    queryKey: QUERY_KEYS.emails.settings(clinicId),
    request: emailsService.settings,
    options: { enabled: !!clinicId },
  });
}

export function useEmailAudiences(clinicId: string) {
  return useFetchData<EmailAudiencesResponse>({
    queryKey: QUERY_KEYS.emails.audiences(clinicId),
    request: emailsService.audiences,
    options: { enabled: !!clinicId },
  });
}

export function useEmailVariables(clinicId: string) {
  return useFetchData<EmailVariablesResponse>({
    queryKey: QUERY_KEYS.emails.variables(clinicId),
    request: emailsService.variables,
    options: { enabled: !!clinicId, staleTime: Infinity },
  });
}

export function useEmailRecipientQuery(
  selection: EmailRecipientSelection,
  enabled = true,
) {
  const clinicId = useClinicId();
  const scope = JSON.stringify({ ...selection, excludedEmails: undefined });
  const [previous, setPrevious] = useState<{
    scope: string;
    data: EmailRecipientsResponse;
  }>();
  const query = useFetchData<EmailRecipientsResponse>({
    queryKey: QUERY_KEYS.emails.recipients(clinicId, selection),
    request: () => emailsService.recipients(selection),
    options: {
      enabled: !!clinicId && enabled,
      keepPreviousData: true,
      staleTime: 15_000,
    },
  });
  if (
    query.data &&
    !query.isPlaceholderData &&
    (previous?.scope !== scope || previous.data !== query.data)
  ) {
    setPrevious({ scope, data: query.data });
  }
  return {
    ...query,
    displayData:
      query.data && !query.isPlaceholderData
        ? query.data
        : previous?.scope === scope
          ? previous.data
          : undefined,
  };
}

export function useEmailPreviewQuery(input: EmailPreviewInput, enabled = true) {
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const brandStamp = clinic?.updatedAt ?? "";
  return useFetchData<EmailPreviewResponse>({
    queryKey: QUERY_KEYS.emails.preview(clinicId, input, brandStamp),
    request: () => emailsService.preview(input),
    options: {
      enabled: !!clinicId && enabled,
      keepPreviousData: true,
      staleTime: 0,
    },
  });
}

export function useTestEmail() {
  return useApiMutation<EmailMessageDetail, TResponseError, EmailTestInput>({
    request: emailsService.test,
    invalidateQueries: QUERY_KEYS.emails.all,
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useApiMutation<
    EmailMessageDetail,
    TResponseError,
    SendCustomEmailInput
  >({
    request: emailsService.send,
    invalidateQueries: QUERY_KEYS.emails.all,
    onError: (error) => {
      if (isHttpStatus(error, 409)) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emails.all });
      }
    },
  });
}

export function useSaveEmailSettings() {
  const { t } = useLanguage();
  const clinicId = useClinicId();
  const queryClient = useQueryClient();
  return useApiMutation<EmailSettingsInput, TResponseError, EmailSettingsInput>(
    {
      request: emailsService.saveSettings,
      invalidateQueries: QUERY_KEYS.emails.all,
      successMessage: t.emails.settingsSaved,
      onSuccess: (settings) => {
        queryClient.setQueryData(
          QUERY_KEYS.emails.settings(clinicId),
          settings,
        );
      },
    },
  );
}
