import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  AuthMe, AuthLoginInput, AuthLoginResponse, AuthTokenInput, AuthOtp,
  AuthVerifyInput, AuthVerifyResponse, AuthForgotInput, AuthRecovery,
  AuthPasswordInput, AuthReady,
} from "@clinic/types";

export type { AuthMe as MeResponse } from "@clinic/types";

export const authService = {
  getMe: () => api.get<AuthMe>(ENDPOINTS.AUTH.ME).then(r => r.data),
  login: (body: AuthLoginInput) => api.post<AuthLoginResponse>(ENDPOINTS.AUTH.LOGIN, body).then(r => r.data),
  sendOtp: (body: AuthTokenInput) => api.post<AuthOtp | AuthRecovery>(ENDPOINTS.AUTH.SEND_OTP, body).then(r => r.data),
  verifyOtp: (body: AuthVerifyInput) => api.post<AuthVerifyResponse>(ENDPOINTS.AUTH.VERIFY_OTP, body).then(r => r.data),
  forgotPassword: (body: AuthForgotInput) => api.post<AuthRecovery>(ENDPOINTS.AUTH.FORGOT_PASSWORD, body).then(r => r.data),
  setPassword: (body: AuthPasswordInput) => api.post<AuthReady>(ENDPOINTS.AUTH.SET_PASSWORD, body).then(r => r.data),
  resetPassword: (body: AuthPasswordInput) => api.post<AuthReady>(ENDPOINTS.AUTH.RESET_PASSWORD, body).then(r => r.data),
};
