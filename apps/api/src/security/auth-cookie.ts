import type { Response, CookieOptions } from "express";
import { ACCESS_TOKEN_SECONDS } from "./security.constants";

const production = process.env.NODE_ENV === "production";
export const AUTH_COOKIE_NAME = production
  ? "__Secure-cureva_session"
  : "cureva_session";

const cookieOptions: CookieOptions = {
  domain: production ? ".cureva.clinic" : undefined,
  httpOnly: true,
  secure: production,
  sameSite: "lax",
  path: "/",
};

export function setAuthCookie(response: Response, token: string) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_SECONDS * 1000,
  });
  response.setHeader("Cache-Control", "no-store");
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  response.setHeader("Cache-Control", "no-store");
}

export function readAuthCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== AUTH_COOKIE_NAME)
      continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value) || null;
    } catch {
      return value || null;
    }
  }
  return null;
}

export function isTrustedBrowserOrigin(origin?: string): boolean {
  if (!origin) return false;
  const trusted = new Set([
    "https://cureva.clinic",
    "https://www.cureva.clinic",
  ]);
  if (process.env.WEB_APP_URL) {
    try {
      trusted.add(new URL(process.env.WEB_APP_URL).origin);
    } catch {
      return false;
    }
  }
  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))
        return true;
    } catch {
      return false;
    }
  }
  return trusted.has(origin);
}

