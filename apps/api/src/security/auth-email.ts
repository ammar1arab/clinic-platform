import { getLocale } from "@/infrastructure/i18n.context";
import { renderEmail } from "@/modules/emails/email-template";
import type { EmailBrandDetails } from "@clinic/types";

const copy = {
  en: {
    otp: "Your verification code",
    expiry: "Valid for 15 minutes. Do not share this code.",
    welcome: "Welcome",
    email: "Email",
    password: "Temporary password",
    setup:
      "Your clinic created your account. Sign in with your email as both email and temporary password, then verify and set a new password.",
    signIn: "Sign in",
  },
  ar: {
    otp: "رمز التحقق",
    expiry: "صالح لمدة 15 دقيقة. لا تشاركه مع أي شخص.",
    welcome: "مرحباً",
    email: "البريد الإلكتروني",
    password: "كلمة المرور المؤقتة",
    setup:
      "أنشأت عيادتك حسابك. سجّل الدخول باستخدام بريدك كالبريد وكلمة المرور المؤقتة، ثم تحقق واختر كلمة مرور جديدة.",
    signIn: "تسجيل الدخول",
  },
} as const;

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
