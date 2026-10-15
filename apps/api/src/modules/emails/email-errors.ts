import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Response } from "express";
import { getLocale } from "@/infrastructure/i18n.context";

const copy = {
  invalidEmailSelection: {
    en: "Invalid recipient selection.",
    ar: "اختيار المستلمين غير صالح.",
  },
  emailSelectionChanged: {
    en: "Recipients changed. Review the recipient selection again before sending.",
    ar: "تغيّرت قائمة المستلمين. راجعها مرة أخرى قبل الإرسال.",
  },
  emailRecipientNotFound: {
    en: "Recipient not found.",
    ar: "المستلم غير موجود.",
  },
  emailUnavailable: {
    en: "Email sending is currently unavailable.",
    ar: "إرسال البريد الإلكتروني غير متاح حالياً.",
  },
  emailActiveUserNotFound: {
    en: "Active user not found.",
    ar: "المستخدم النشط غير موجود.",
  },
  emailNoRecipients: {
    en: "No recipients match the selected criteria.",
    ar: "لا يوجد مستلمون يطابقون المعايير المحددة.",
  },
  emailRequestConflict: {
    en: "Request ID was already used with different content.",
    ar: "تم استخدام معرّف الطلب مع محتوى مختلف.",
  },
  emailWebhookUnavailable: {
    en: "Email webhook is unavailable.",
    ar: "إشعارات البريد الإلكتروني غير متاحة.",
  },
  emailWebhookSignatureInvalid: {
    en: "Invalid webhook signature.",
    ar: "توقيع إشعار البريد الإلكتروني غير صالح.",
  },
  emailWebhookBodyRequired: {
    en: "Webhook body is required.",
    ar: "محتوى إشعار البريد الإلكتروني مطلوب.",
  },
  emailWebhookTimestampInvalid: {
    en: "Invalid webhook timestamp.",
    ar: "وقت إشعار البريد الإلكتروني غير صالح.",
  },
  emailClinicNotFound: {
    en: "Clinic not found.",
    ar: "العيادة غير موجودة.",
  },
  emailDateRangeInvalid: {
    en: "Start date cannot be after end date.",
    ar: "لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية.",
  },
  emailMessageNotFound: {
    en: "Email message not found.",
    ar: "رسالة البريد الإلكتروني غير موجودة.",
  },
  emailRecipientsRequired: {
    en: "A recipient filter or external address is required.",
    ar: "يجب تحديد فلتر للمستلمين أو عنوان بريد خارجي.",
  },
  emailRecipientLimitExceeded: {
    en: "The maximum of 500 recipients was exceeded.",
    ar: "تم تجاوز الحد الأقصى البالغ 500 مستلم.",
  },
  emailFiltersIncompatible: {
    en: "Filters are incompatible with the selected audience.",
    ar: "الفلاتر لا تتوافق مع فئة المستلمين المحددة.",
  },
  emailPractitionerNotFound: {
    en: "Practitioner not found or inactive.",
    ar: "الممارس غير موجود أو غير نشط.",
  },
  emailDepartmentNotFound: {
    en: "Department not found or inactive.",
    ar: "القسم غير موجود أو غير نشط.",
  },
  emailServiceNotFound: {
    en: "Service not found or inactive.",
    ar: "الخدمة غير موجودة أو غير نشطة.",
  },
  emailTemplateVariableInvalid: {
    en: "Unknown email template variable.",
    ar: "متغير قالب البريد الإلكتروني غير معروف.",
  },
  emailContentRequired: {
    en: "Subject and body are required.",
    ar: "العنوان والمحتوى مطلوبان.",
  },
  emailSubjectTooLong: {
    en: "Email subject is too long.",
    ar: "عنوان البريد الإلكتروني طويل جداً.",
  },
  invalidEmailRequest: {
    en: "Invalid email request.",
    ar: "طلب البريد الإلكتروني غير صالح.",
  },
} as const;

export const emailError = (code: keyof typeof copy) => ({
  code,
  message: copy[code][getLocale()],
});

@Catch(HttpException)
export class EmailExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const value = exception.getResponse();
    const body =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : { message: value };
    const response = host.switchToHttp().getResponse<Response>();
    if (status === 429 && typeof body.retryAfterSeconds === "number") {
      response.setHeader("Retry-After", body.retryAfterSeconds);
    }
    response
      .status(status)
      .json(
        status === 400 && !body.code ? emailError("invalidEmailRequest") : body,
      );
  }
}
