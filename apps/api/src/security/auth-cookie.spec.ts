import type { Response } from "express";
import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  isTrustedBrowserOrigin,
  readAuthCookie,
  setAuthCookie,
} from "./auth-cookie";

describe("browser auth cookie", () => {
  it("sets an HttpOnly, same-site session cookie without caching the response", () => {
    const cookie = jest.fn();
    const setHeader = jest.fn();
    const response = { cookie, setHeader } as unknown as Response;

    setAuthCookie(response, "signed-token");

    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "signed-token",
      expect.objectContaining({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expect.any(Number),
      }),
    );
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  it("reads only the configured session cookie and clears it with matching scope", () => {
    expect(readAuthCookie(`other=value; ${AUTH_COOKIE_NAME}=a%2Eb`)).toBe("a.b");
    expect(readAuthCookie("other=value")).toBeNull();

    const clearCookie = jest.fn();
    const setHeader = jest.fn();
    clearAuthCookie({ clearCookie, setHeader } as unknown as Response);

    expect(clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  it("accepts only trusted production origins and local development origins", () => {
    expect(isTrustedBrowserOrigin("https://cureva.clinic")).toBe(true);
    expect(isTrustedBrowserOrigin("https://attacker.invalid")).toBe(false);
    if (process.env.NODE_ENV !== "production") {
      expect(isTrustedBrowserOrigin("http://localhost:3000")).toBe(true);
      expect(isTrustedBrowserOrigin("http://attacker.invalid")).toBe(false);
    }
  });
});
