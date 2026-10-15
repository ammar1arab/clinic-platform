import type {
  AppointmentStatus,
  EmailAudience,
  EmailDeliveryStatus,
  Locale,
  Role,
} from './enums';

export type EmailLocale = Locale;
export type { EmailAudience, EmailDeliveryStatus };

export interface EmailRecipientFilters {
  audience: EmailAudience | 'all';
  ids?: string[];
  search?: string;
  roles?: Role[];
  doctorId?: string;
  departmentId?: string;
  serviceId?: string;
  appointmentStatuses?: AppointmentStatus[];
  appointmentFrom?: string;
  appointmentTo?: string;
  isPaid?: boolean;
}

export interface EmailRecipientSelection {
  filters?: EmailRecipientFilters;
  externalRecipients?: {
    email: string;
    name?: string;
  }[];
  excludedEmails?: string[];
}

export interface EmailContent {
  locale: EmailLocale;
  subject: string;
  body: string;
}

export interface SendCustomEmailInput
  extends EmailContent,
    EmailRecipientSelection {
  requestId: string;
  selectionHash: string;
}

export interface EmailSettingsInput {
  replyTo?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  footerEn?: string;
  footerAr?: string;
}

export interface EmailBrandDetails extends EmailSettingsInput {
  name: string;
  nameAr: string | null;
  logoUrl: string | null;
  brandColor?: string | null;
  timezone: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}

export interface EmailRecipientPreview {
  sourceId: string | null;
  audience: EmailAudience | 'external';
  email: string;
  name: string;
  nameAr?: string;
  phone?: string | null;
  department?: string | null;
  departmentAr?: string | null;
  gender?: string | null;
}

export interface EmailRecipientsResponse {
  recipients: EmailRecipientPreview[];
  count: number;
  selectionHash: string;
}

export interface EmailPreviewInput extends EmailContent {
  externalRecipient?: { email: string; name?: string };
  recipient?: {
    audience: EmailAudience;
    id: string;
  };
}

export interface EmailPreviewResponse {
  subject: string;
  html: string;
  text: string;
}

export interface EmailMessageSummary {
  id: string;
  subject: string;
  locale: EmailLocale;
  isTest: boolean;
  createdAt: string;
  senderName: string;
  senderNameAr: string | null;
  audiences: (EmailAudience | 'external')[];
  recipientCount: number;
  counts: Partial<Record<EmailDeliveryStatus, number>>;
}

export interface EmailHistoryResponse {
  items: EmailMessageSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface EmailRecipientDelivery {
  id: string;
  email: string;
  name: string;
  status: EmailDeliveryStatus;
  providerId: string | null;
  attempts: number;
  lastError: string | null;
  updatedAt: string;
}

export interface EmailMessageDetail extends EmailMessageSummary {
  body: string;
  rendered?: EmailPreviewResponse;
  recipients: EmailRecipientDelivery[];
  totalRecipients: number;
  page: number;
  limit: number;
}

export interface EmailTemplatePreset extends EmailContent {
  id: string;
  name: string;
}

export interface EmailPaginationInput {
  page?: number;
  limit?: number;
}

export interface EmailHistoryInput extends EmailPaginationInput {
  from?: string;
  to?: string;
  search?: string;
  status?: EmailDeliveryStatus;
  isTest?: boolean;
}

export interface EmailTestInput extends EmailContent {
  requestId: string;
}

export interface EmailVariablesResponse {
  variables: string[];
}

export interface EmailAudiencesResponse {
  audiences: EmailRecipientFilters['audience'][];
}
