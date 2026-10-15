import { getLocale } from "@/infrastructure/i18n.context";
import { escapeHtml } from "@/infrastructure";

const copy = {
  en: {
    dir: "ltr",
    otp: "Your Cureva Clinic verification code",
    expiry: "Valid for 15 minutes. Do not share this code.",
    welcome: "Welcome to Cureva Clinic",
    email: "Email",
    password: "Temporary password",
    setup:
      "Your clinic created your account. Sign in with your email as both email and temporary password, then verify and set a new password.",
    signIn: "Sign in to Cureva Clinic",
  },
  ar: {
    dir: "rtl",
    otp: "رمز التحقق من Cureva Clinic",
    expiry: "صالح لمدة 15 دقيقة. لا تشاركه مع أي شخص.",
    welcome: "مرحباً بك في Cureva Clinic",
    email: "البريد الإلكتروني",
    password: "كلمة المرور المؤقتة",
    setup:
      "أنشأت عيادتك حسابك. سجّل الدخول باستخدام بريدك كالبريد وكلمة المرور المؤقتة، ثم تحقق واختر كلمة مرور جديدة.",
    signIn: "تسجيل الدخول إلى Cureva Clinic",
  },
};

function appOrigin() {
  const origin =
    process.env.WEB_APP_URL ??
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  const url = new URL(origin || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("WEB_APP_URL must be an HTTP URL");
  return url.origin;
}

function branded(dir: string, body: string) {
  const mark = `${appOrigin()}/brand/cureva-mark.png`;
  return `<!doctype html>
<html dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6">
    <tr>
      <td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:28px 24px;text-align:center;background:#0f766e">
              <img src="${escapeHtml(mark)}" alt="Cureva Clinic" width="56" height="56" style="display:block;margin:0 auto 12px;border:0;border-radius:14px;background:#ffffff">
              <p style="margin:0;font-size:20px;line-height:1.3;font-weight:700;color:#ffffff">Cureva Clinic</p>
            </td>
          </tr>
          <tr>
            <td dir="${dir}" style="padding:32px 28px;text-align:${dir === "rtl" ? "right" : "left"};color:#1f2937;font-size:16px;line-height:1.7">${body}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpEmail(code: string) {
  const t = copy[getLocale()];
  return {
    subject: t.otp,
    html: branded(
      t.dir,
      `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:#111827">${t.otp}</h1><p style="margin:0 0 12px;font-size:28px;letter-spacing:4px;font-weight:700;color:#0f766e">${escapeHtml(code)}</p><p style="margin:0;color:#6b7280">${t.expiry}</p>`,
    ),
  };
}

export function welcomeEmail(input: {
  name: string;
  to: string;
  temporaryPassword: string;
}) {
  const t = copy[getLocale()];
  const url = new URL("/login", appOrigin());
  return {
    subject: t.welcome,
    html: branded(
      t.dir,
      `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:#111827">${t.welcome}</h1><p style="margin:0 0 12px">${escapeHtml(input.name)}</p><p style="margin:0 0 16px">${t.setup}</p><p style="margin:0 0 8px">${t.email}: <bdi>${escapeHtml(input.to)}</bdi></p><p style="margin:0 0 20px">${t.password}: <bdi>${escapeHtml(input.temporaryPassword)}</bdi></p><a href="${escapeHtml(url.href)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700">${t.signIn}</a>`,
    ),
  };
}
