import { getLocale } from "@/infrastructure/i18n.context";

const copy = {
  en: {
    dir: "ltr",
    otp: "Your Cureva verification code",
    expiry: "Valid for 15 minutes. Do not share this code.",
    welcome: "Welcome to Cureva",
    email: "Email",
    password: "Temporary password",
    setup:
      "Your clinic created your account. Sign in with your email as both email and temporary password, then verify and set a new password.",
    signIn: "Sign in to Cureva",
  },
  ar: {
    dir: "rtl",
    otp: "رمز التحقق من كيوريفا",
    expiry: "صالح لمدة 15 دقيقة. لا تشاركه مع أي شخص.",
    welcome: "مرحباً بك في كيوريفا",
    email: "البريد الإلكتروني",
    password: "كلمة المرور المؤقتة",
    setup:
      "أنشأت عيادتك حسابك. سجّل الدخول باستخدام بريدك كالبريد وكلمة المرور المؤقتة، ثم تحقق واختر كلمة مرور جديدة.",
    signIn: "تسجيل الدخول إلى كيوريفا",
  },
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export function otpEmail(code: string) {
  const t = copy[getLocale()];
  return {
    subject: t.otp,
    html: `<div dir="${t.dir}"><h2>${t.otp}</h2><p>${escapeHtml(code)}</p><p>${t.expiry}</p></div>`,
  };
}

export function welcomeEmail(input: {
  name: string;
  to: string;
  temporaryPassword: string;
}) {
  const t = copy[getLocale()];
  const origin =
    process.env.WEB_APP_URL ??
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  const url = new URL("/login", origin);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("WEB_APP_URL must be an HTTP URL");
  return {
    subject: t.welcome,
    html: `<div dir="${t.dir}"><h2>${t.welcome}</h2><p>${escapeHtml(input.name)}</p><p>${t.setup}</p><p>${t.email}: <bdi>${escapeHtml(input.to)}</bdi></p><p>${t.password}: <bdi>${escapeHtml(input.temporaryPassword)}</bdi></p><a href="${escapeHtml(url.href)}">${t.signIn}</a></div>`,
  };
}
