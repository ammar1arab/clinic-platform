import { api } from "@/lib/api";
import type { AuthMe, AuthTokenResponse } from "@clinic/types";

export type { AuthMe as MeResponse } from "@clinic/types";

export const authService = {
  getMe: () => api.get<AuthMe>("/auth/me").then((r) => r.data),

  login: (email: string, password: string) =>
    api
      .post<AuthTokenResponse>("/auth/login", { email, password })
      .then((r) => r.data),
};
