import { getTranslations } from "@/i18n";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  AccountProfileInput, OwnerOtpResponse, OwnerResetPasswordInput, AuthMe, AuthLoginInput, AuthLoginResponse, AuthTokenInput, AuthOtp, AuthEmailChange, AuthPasswordChange, AuthPasswordConfirmInput,
  AuthVerifyInput, AuthVerifyResponse, AuthForgotInput, AuthRecovery,
  AuthPasswordInput, AuthReady,
} from "@clinic/types";

export type { AuthMe as MeResponse } from "@clinic/types";

export const authService = {
  requestEmailChange: (email: string) =>
    api.post<AuthEmailChange>(ENDPOINTS.AUTH.PROFILE_EMAIL, { email }).then((r) => r.data),
  confirmEmailChange: (body: AuthVerifyInput) =>
    api.post<{ success: true }>(ENDPOINTS.AUTH.PROFILE_EMAIL_CONFIRM, body).then((r) => r.data),
  requestPasswordChange: () =>
    api.post<AuthPasswordChange>(ENDPOINTS.AUTH.PROFILE_PASSWORD).then((r) => r.data),
  confirmPasswordChange: (body: AuthPasswordConfirmInput) =>
    api.post<{ success: true }>(ENDPOINTS.AUTH.PROFILE_PASSWORD_CONFIRM, body).then((r) => r.data),
  resendPasswordChange: (token: string) =>
    api.post<AuthPasswordChange>(ENDPOINTS.AUTH.SEND_OTP, { token }).then((r) => r.data),
  resendEmailChange: (token: string) =>
    api.post<AuthEmailChange>(ENDPOINTS.AUTH.SEND_OTP, { token }).then((r) => r.data),
  updateProfile: async (input: AccountProfileInput) => {
    const { data } = await api.patch<AuthMe>(ENDPOINTS.AUTH.PROFILE, input);
    if (input.email !== undefined && data.email !== input.email.trim().toLowerCase()) {
      throw new Error(getTranslations().errors.profileEmailNotSaved);
    }
    return data;
  },
  ownerGenerateOtp: (id: string) => api.post<OwnerOtpResponse>(ENDPOINTS.AUTH.OWNER_OTP(id)).then(r => r.data),
  ownerResetPassword: (id: string, input: OwnerResetPasswordInput) =>
    api.post<{ success: true }>(ENDPOINTS.AUTH.OWNER_RESET_PASSWORD(id), input).then(r => r.data),
  getMe: () => api.get<AuthMe>(ENDPOINTS.AUTH.ME).then(r => r.data),
  login: (body: AuthLoginInput) => api.post<AuthLoginResponse>(ENDPOINTS.AUTH.LOGIN, body).then(r => r.data),
  guest: () => api.post<AuthReady>(ENDPOINTS.AUTH.GUEST).then(r => r.data),
  sendOtp: (body: AuthTokenInput) => api.post<AuthOtp | AuthRecovery>(ENDPOINTS.AUTH.SEND_OTP, body).then(r => r.data),
  verifyOtp: (body: AuthVerifyInput) => api.post<AuthVerifyResponse>(ENDPOINTS.AUTH.VERIFY_OTP, body).then(r => r.data),
  forgotPassword: (body: AuthForgotInput) => api.post<AuthRecovery>(ENDPOINTS.AUTH.FORGOT_PASSWORD, body).then(r => r.data),
  setPassword: (body: AuthPasswordInput) => api.post<AuthReady>(ENDPOINTS.AUTH.SET_PASSWORD, body).then(r => r.data),
  resetPassword: (body: AuthPasswordInput) => api.post<AuthReady>(ENDPOINTS.AUTH.RESET_PASSWORD, body).then(r => r.data),
};
