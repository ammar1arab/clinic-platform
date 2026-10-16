import type { AuthMe } from './auth';

export const AUTH_POLICY = {
  otpDigits: 6,
  otpExpiresSeconds: 15 * 60,
  resendSeconds: 60,
  maxOtpAttempts: 5,
  maxSendsPerHour: 5,
} as const;

export function passwordRequirements(password: string) {
  return { present: password.length > 0 };
}

export type AuthReady = { next: 'ready'; user: AuthMe };
export type AuthSetup = { next: 'set_password'; setupToken: string; email: string };
export type AuthOtp = { next: 'otp'; setupToken: string; email: string; cooldownSeconds: number };
export type AuthEmailChange = { next: 'otp'; token: string; email: string; cooldownSeconds: number } | { next: 'unchanged' };
export type AuthPasswordChange = { next: 'otp'; token: string; email: string; cooldownSeconds: number };
export type AuthPasswordConfirmInput = { token: string; code: string; password: string };
export type AuthLoginResponse = AuthReady | AuthSetup | AuthOtp;
export type AuthRecovery = { next: 'otp'; recoveryToken: string; email: string; cooldownSeconds: number };
export type AuthReset = { next: 'reset_password'; resetToken: string };
export type AuthVerifyResponse = AuthReady | AuthSetup | AuthReset;
export type AuthLoginInput = { email: string; password: string };
export type AuthVerifyInput = { token: string; code: string };
export type AuthPasswordInput = { token: string; password: string };
export type AuthTokenInput = { token: string };
export type AuthForgotInput = { email: string };
export type AuthErrorCode = 'invalidCredentials' | 'invalidToken' | 'invalidOtp' | 'rateLimited' | 'weakPassword' | 'emailUnavailable' | 'clinicUnavailable' | 'invalidRequest' | 'noPendingOtp' | 'emailInUse';

export interface OwnerResetPasswordInput { password: string; }

export interface OwnerOtpResponse { code: string; expiresAt: string; }
