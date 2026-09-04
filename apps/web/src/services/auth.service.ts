import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type { AuthMe, AuthTokenResponse } from "@clinic/types";

export type { AuthMe as MeResponse } from "@clinic/types";

export const authService = {
  getMe: () => api.get<AuthMe>(ENDPOINTS.AUTH.ME).then((r) => r.data),

  login: (email: string, password: string) =>
    api
      .post<AuthTokenResponse>(ENDPOINTS.AUTH.LOGIN, { email, password })
      .then((r) => r.data),
};
