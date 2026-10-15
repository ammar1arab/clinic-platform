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

  const links = (
    [
      ["website", isArabic ? "الموقع" : "Website", website],
      ["instagram", "Instagram", brand.instagramUrl],
      ["facebook", "Facebook", brand.facebookUrl],
      ["linkedin", "LinkedIn", brand.linkedinUrl],
    ] as const
  ).flatMap(([id, label, href]) => {
    const url = secureUrl(href);
    return url ? [{ id, label, url }] : [];
  });
  const socialLinks = links
    .map(
      ({ id, label, url }) =>
        `<td align="center" style="padding:0 7px"><a href="${escapeHtml(url)}" title="${label}" style="display:inline-block;text-decoration:none"><img src="${emailIcon(id)}" width="22" height="22" alt="${label}" style="display:block;border:0"></a></td>`,
    )
    .join("");

  const align = isArabic ? "right" : "left";
  const html = `<!doctype html>
<html lang="${content.locale}" dir="${isArabic ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr>
      <td align="center" style="padding:0">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table data-email-shell="true" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:separate;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt">
          <tr>
            <td data-email-header="true" align="center" bgcolor="${accent}" style="padding:24px;text-align:center;background:${accent};border-radius:12px 12px 0 0">
              ${
                logo
                  ? `<img src="${escapeHtml(logo)}" width="56" height="56" alt="" style="display:block;margin:0 auto 12px;border:0;background:transparent;object-fit:contain">`
                  : ""
              }
              <p style="margin:0;font-size:20px;line-height:1.4;font-weight:700;color:#ffffff">${escapeHtml(clinicName)}</p>
            </td>
          </tr>
          <tr>
            <td data-email-content="true" dir="${isArabic ? "rtl" : "ltr"}" align="${align}" style="padding:28px 24px 12px;text-align:${align};color:#1f2937">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.45;font-weight:700;color:#111827">${escapeHtml(subject)}</h1>
              <div style="font-size:16px;line-height:1.7;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(body).replace(/\r?\n/g, "<br>")}</div>
            </td>
          </tr>
          <tr>
            <td data-email-gap="true" height="48" style="height:48px;line-height:48px;font-size:1px">&nbsp;</td>
          </tr>
          <tr>
            <td data-email-footer="true" align="center" style="padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
              ${
                footer
                  ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280">${escapeHtml(footer).replace(/\r?\n/g, "<br>")}</p>`
                  : ""
              }
              ${socialLinks ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt"><tr>${socialLinks}</tr></table>` : ""}
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    html,
    text: [
      clinicName,
      subject,
      body,
      footer,
      ...links.map(({ label, url }) => `${label}: ${url}`),
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
};
