import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  EmailHistoryInput,
  EmailHistoryResponse,
  EmailMessageDetail,
  EmailPaginationInput,
  EmailPreviewInput,
  EmailPreviewResponse,
  EmailRecipientSelection,
  EmailRecipientsResponse,
  EmailSettingsInput,
  EmailTestInput,
  EmailVariablesResponse,
  SendCustomEmailInput,
} from "@clinic/types";

const paths = ENDPOINTS.EMAILS;

export const emailsService = {
  history: (params: EmailHistoryInput) =>
    api.get<EmailHistoryResponse>(paths.BASE, { params }).then((r) => r.data),
  detail: (id: string, params: EmailPaginationInput) =>
    api
      .get<EmailMessageDetail>(paths.BY_ID(id), { params })
      .then((r) => r.data),
  recipients: (input: EmailRecipientSelection) =>
    api
      .post<EmailRecipientsResponse>(paths.RECIPIENTS, input)
      .then((r) => r.data),
  preview: (input: EmailPreviewInput) =>
    api.post<EmailPreviewResponse>(paths.PREVIEW, input).then((r) => r.data),
  variables: () =>
    api.get<EmailVariablesResponse>(paths.VARIABLES).then((r) => r.data),
  test: (input: EmailTestInput) =>
    api.post<EmailMessageDetail>(paths.TEST, input).then((r) => r.data),
  send: (input: SendCustomEmailInput) =>
    api.post<EmailMessageDetail>(paths.SEND, input).then((r) => r.data),
  settings: () =>
    api.get<EmailSettingsInput>(paths.SETTINGS).then((r) => r.data),
  saveSettings: (input: EmailSettingsInput) =>
    api.put<EmailSettingsInput>(paths.SETTINGS, input).then((r) => r.data),
};
