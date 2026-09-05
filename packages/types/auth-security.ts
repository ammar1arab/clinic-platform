export const AUTH_POLICY = {
  otpDigits: 6,
  otpExpiresSeconds: 15 * 60,
  resendSeconds: 60,
  maxOtpAttempts: 5,
  maxSendsPerHour: 5,
  passwordMin: 8,
  passwordMax: 64,
} as const;

export function passwordRequirements(password: string) {
  return {
    length: password.length >= AUTH_POLICY.passwordMin && new TextEncoder().encode(password).length <= AUTH_POLICY.passwordMax,
    letter: /\p{L}/u.test(password),
    number: /\p{N}/u.test(password),
  };
}

export type AuthReady = { next: 'ready'; accessToken: string };
export type AuthSetup = { next: 'set_password'; setupToken: string; email: string };
export type AuthOtp = { next: 'otp'; setupToken: string; email: string; cooldownSeconds: number };
export type AuthLoginResponse = AuthReady | AuthSetup | AuthOtp;
export type AuthRecovery = { next: 'otp'; recoveryToken: string; email: string; cooldownSeconds: number };
export type AuthReset = { next: 'reset_password'; resetToken: string };
export type AuthVerifyResponse = AuthReady | AuthSetup | AuthReset;
export type AuthLoginInput = { email: string; password: string };
export type AuthVerifyInput = { token: string; code: string };
export type AuthPasswordInput = { token: string; password: string };
export type AuthTokenInput = { token: string };
export type AuthForgotInput = { email: string };
export type AuthErrorCode = 'invalidCredentials' | 'invalidToken' | 'invalidOtp' | 'rateLimited' | 'weakPassword' | 'emailUnavailable' | 'clinicUnavailable' | 'invalidRequest';
