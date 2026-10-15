import { emailIcon } from "./email-icons";
import { emailError } from "./email-errors";
import { BadRequestException } from "@nestjs/common";
import {
  LOCALE,
  type EmailBrandDetails,
  type EmailContent,
  type EmailPreviewResponse,
} from "@clinic/types";
import { escapeHtml } from "@/infrastructure";

export const EMAIL_VARIABLES = [
  "recipientName",
  "clinicName",
  "date",
  "clinicPhone",
  "clinicAddress",
  "clinicEmail",
] as const;

const DEFAULT_ACCENT = "#0f766e";

const accentOf = (value?: string | null) =>
  value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_ACCENT;

const socialIcon = (
  id: Parameters<typeof emailIcon>[0],
  label: string,
  accent: string,
) =>
  `<img src="${emailIcon(id, accent)}" width="20" height="20" alt="${label}" style="display:inline-block;border:0;vertical-align:middle">`;

const storedLogo = (value?: string | null): string | null => {
  const https = secureUrl(value);
  if (https) return https;
  if (
    value &&
    /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(value) &&
    value.length <= 1_500_000
  ) {
    return value;
  }
  return null;
};

const secureUrl = (value?: string | null): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
};

export const renderEmail = (
  content: EmailContent,
  brand: EmailBrandDetails,
  recipientName: string,
  now = new Date(),
): EmailPreviewResponse => {
  const isArabic = content.locale === LOCALE.AR;
  const clinicName = isArabic ? brand.nameAr || brand.name : brand.name;

  let formattedDate: string;
  try {
    formattedDate = new Intl.DateTimeFormat(content.locale, {
      timeZone: brand.timezone,
      dateStyle: "medium",
    }).format(now);
  } catch {
    formattedDate = new Intl.DateTimeFormat(content.locale, {
      timeZone: "UTC",
      dateStyle: "medium",
    }).format(now);
  }

  const variables: Record<string, string> = {
    recipientName,
    clinicName,
    date: formattedDate,
    clinicPhone: brand.phone?.trim() ?? "",
    clinicAddress: brand.address?.trim() ?? "",
    clinicEmail: brand.email?.trim() ?? "",
  };

  const resolve = (text: string): string =>
    text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, key: string) => {
      if (!Object.hasOwn(variables, key)) {
        throw new BadRequestException(
          emailError("emailTemplateVariableInvalid"),
        );
      }
      return variables[key];
    });

  const subject = resolve(content.subject)
    .replace(/[\r\n]/g, " ")
    .trim();

  const body = resolve(content.body).trim();

  if (subject.length > 300) {
    throw new BadRequestException(emailError("emailSubjectTooLong"));
  }

  const footer = isArabic ? brand.footerAr : brand.footerEn;
  const accent = accentOf(brand.brandColor);
  const logo = storedLogo(brand.logoUrl);
  const website = secureUrl(brand.websiteUrl);

  const socialLinks = (
    [
      ["website", "Website", website],
      ["instagram", "Instagram", brand.instagramUrl],
      ["facebook", "Facebook", brand.facebookUrl],
      ["linkedin", "LinkedIn", brand.linkedinUrl],
    ] as const
  )
    .map(([id, label, href]) => {
      const url = id === "website" ? href : secureUrl(href);
      if (!url) return "";
      return `<a href="${escapeHtml(url)}" title="${label}" style="display:inline-block;margin:0 6px;text-decoration:none">${socialIcon(id, label, accent)}</a>`;
    })
    .join("");

  const align = isArabic ? "right" : "left";
  const html = `<!doctype html>
<html lang="${content.locale}" dir="${isArabic ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr>
      <td align="center" style="padding:0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:28px 24px;text-align:center;background:${accent}">
              ${
                logo
                  ? `<img src="${escapeHtml(logo)}" width="72" height="72" alt="" style="display:block;margin:0 auto 12px;border:0;background:transparent;object-fit:contain">`
                  : ""
              }
              <p style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff">${escapeHtml(clinicName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 16px;text-align:${align};color:#1f2937">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;font-weight:700;color:#111827">${escapeHtml(subject)}</h1>
              <div style="font-size:16px;line-height:1.75;overflow-wrap:anywhere">${escapeHtml(body).replace(/\r?\n/g, "<br>")}</div>
            </td>
          </tr>
          <tr>
            <td data-email-gap="true" height="96" style="height:96px;line-height:96px;font-size:1px">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;text-align:center;border-top:1px solid #e5e7eb">
              ${
                footer
                  ? `<p style="margin:16px 0;font-size:13px;line-height:1.6;color:#6b7280">${escapeHtml(footer).replace(/\r?\n/g, "<br>")}</p>`
                  : ""
              }
              ${socialLinks ? `<p style="margin:12px 0 0">${socialLinks}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    html,
    text: [clinicName, subject, body, footer, website]
      .filter(Boolean)
      .join("\n\n"),
  };
};
