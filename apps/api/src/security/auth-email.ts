import { SHARED_EN, SHARED_AR } from '@clinic/types';
import { getLocale } from "@/infrastructure/i18n.context";
import { renderEmail } from "@/modules/emails/email-template";
import type { EmailBrandDetails } from "@clinic/types";

const copy = { en: SHARED_EN.authEmail, ar: SHARED_AR.authEmail };

function letter(
  brand: EmailBrandDetails,
  subject: string,
  body: string,
  recipientName: string,
) {
  return renderEmail(
    { locale: getLocale(), subject, body },
    brand,
    recipientName,
  );
}

export function otpEmail(
  code: string,
  brand: EmailBrandDetails,
  recipientName: string,
) {
  const t = copy[getLocale()];
  return letter(brand, t.otp, `${code}\n\n${t.expiry}`, recipientName);
}

export function welcomeEmail(
  input: { name: string; to: string; temporaryPassword: string },
  brand: EmailBrandDetails,
) {
  const t = copy[getLocale()];
  const origin =
    process.env.WEB_APP_URL ??
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  return letter(
    brand,
    t.welcome,
    [
      input.name,
      t.setup,
      `${t.email}: ${input.to}`,
      `${t.password}: ${input.temporaryPassword}`,
      `${t.signIn}: ${origin}/login`,
    ].join("\n\n"),
    input.name,
  );
}
