"use client";

import { useCallback, useRef, useState } from "react";
import { redirect } from "next/navigation";
import type { AuthLoginResponse, AuthRecovery, AuthReset } from "@clinic/types";
import { Card, CardContent, Button } from "@/components/ui";
import { useAuth, useLanguage } from "@/providers";
import { useAuthMutation } from "@/hooks/api/use-auth-mutations";
import { extractErrorMessage } from "@/lib/api";
import {
  FeedbackOverlay,
  SUCCESS_OVERLAY_MS,
} from "@/components/primitives/states/feedback-overlay";
import { ClinicBrandMark } from "@/components/primitives/display/brand-mark";
import { LoadingState, ErrorState } from "@/components/primitives";
import { bindClinicBrand, useClinicBrand } from "@/hooks/api/use-clinic";
import { prepareFeedbackSound } from "@/lib/feedback-sound";
import { postLoginPath } from "@/constants/nav-access";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { CredentialsForm } from "./credentials-form";
import { PasswordForm } from "./password-form";
import { OtpVerificationForm } from "./otp-verification-form";

type Step =
  | { next: "login" | "forgot" }
  | Exclude<AuthLoginResponse, { next: "ready" }>
  | AuthRecovery
  | AuthReset;

function readReturnPath() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("from");
}

export function AuthFlow({ hasSession = false }: { hasSession?: boolean }) {
  const [step, setStep] = useState<Step>({ next: "login" });
  const [resendAt, setResendAt] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const completing = useRef(false);
  const destRef = useRef<string>(ROUTES.DASHBOARD);
  const { login, user, isAuthenticated, isLoading, isHydrated, isSessionError, retrySession } = useAuth();
  const { t } = useLanguage();
  const brand = useClinicBrand();
  const bindBrand = useCallback(
    (node: HTMLElement | null) => bindClinicBrand(node, brand),
    [brand],
  );
  const mutation = useAuthMutation();
  const pending = mutation.isPending || success;
  const flipped = step.next !== "login";
  const recovery =
    step.next === "forgot" ||
    step.next === "reset_password" ||
    "recoveryToken" in step;
  const challengeToken =
    "recoveryToken" in step
      ? step.recoveryToken
      : "setupToken" in step
        ? step.setupToken
        : "";

  const resetTo = (next: "login" | "forgot") => {
    setError("");
    mutation.reset();
    setStep({ next });
  };

  const complete = useCallback(() => {
    if (completing.current) return;
    completing.current = true;
    window.location.replace(destRef.current);
  }, []);

  if (hasSession && (!isHydrated || isLoading) && !success) {
    return (
      <div ref={bindBrand} className="contents">
        <LoadingState variant="page" text={t.auth.signingIn} />
      </div>
    );
  }

  if (isSessionError && !success) return <ErrorState onRetry={retrySession} />;

  if (isAuthenticated && user && !success) {
    redirect(postLoginPath(user.role, readReturnPath()));
  }

  const submit = async (
    command: Parameters<typeof mutation.mutateAsync>[0],
  ) => {
    setError("");
    try {
      const response = await mutation.mutateAsync(command);
      if (response.next === "ready") {
        setSuccess(true);
        const me = await login(response.user);
        destRef.current = postLoginPath(me.role, readReturnPath());
        window.setTimeout(complete, SUCCESS_OVERLAY_MS);
        return;
      }
      if (response.next === "otp")
        setResendAt(Date.now() + response.cooldownSeconds * 1000);
      setStep(response);
    } catch (cause) {
      setSuccess(false);
      setError(
        extractErrorMessage(cause as Parameters<typeof extractErrorMessage>[0]),
      );
    }
  };

  const loginAsGuest = () => submit({ action: "guest" });

  const title =
    step.next === "otp"
      ? t.auth.verifyEmail
      : step.next === "set_password"
        ? t.auth.setPassword
        : step.next === "reset_password"
          ? t.auth.resetPassword
          : step.next === "forgot"
            ? t.auth.forgotPassword
            : t.auth.title;

  const description =
    step.next === "otp"
      ? recovery
        ? t.auth.recoverySent
        : t.auth.codeSent
      : recovery
        ? t.auth.recoveryDescription
        : t.auth.description;

  const alert = error ? (
    <p
      role="alert"
      className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
    >
      {error}
    </p>
  ) : null;

  return (
    <main
      ref={bindBrand}
      className="grid min-h-dvh place-items-center bg-background px-4 py-8"
      onPointerDown={prepareFeedbackSound}
    >
      <div className="auth-flip w-full max-w-sm">
        <div className={cn("auth-flip-inner", flipped && "auth-flip-flipped")}>
          <Card
            className="auth-flip-face"
            aura
            aria-hidden={flipped}
            inert={flipped || undefined}
          >
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <ClinicBrandMark size="md" />
                <h1 className="font-heading text-xl font-semibold">
                  {t.auth.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t.auth.description}
                </p>
              </div>
              {!flipped && alert}
              <CredentialsForm
                recovery={false}
                pending={pending}
                onSubmit={(data) => submit({ action: "login", data })}
              />
              <Button
                variant="link"
                className="w-full"
                disabled={pending}
                onClick={() => resetTo("forgot")}
              >
                {t.auth.forgotPassword}
              </Button>
              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground select-none">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={loginAsGuest}
              >
                {t.auth.guest}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="auth-flip-face auth-flip-back"
            aura
            aria-hidden={!flipped}
            inert={!flipped || undefined}
          >
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <ClinicBrandMark size="md" />
                <h1 className="font-heading text-xl font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
                {"email" in step && (
                  <bdi className="max-w-full break-all text-sm font-medium">
                    {step.email}
                  </bdi>
                )}
              </div>
              {flipped && alert}
              <div
                key={step.next}
                className="fade-in motion-reduce:animate-none"
              >
                {step.next === "forgot" && (
                  <CredentialsForm
                    recovery
                    pending={pending}
                    onSubmit={(data) =>
                      submit({
                        action: "forgotPassword",
                        data: { email: data.email },
                      })
                    }
                  />
                )}
                {step.next === "otp" && (
                  <OtpVerificationForm
                    pending={pending}
                    resendAt={resendAt}
                    onVerify={(code) =>
                      submit({
                        action: "verifyOtp",
                        data: { code, token: challengeToken },
                      })
                    }
                    onResend={() =>
                      submit({
                        action: "sendOtp",
                        data: { token: challengeToken },
                      })
                    }
                  />
                )}
                {(step.next === "set_password" ||
                  step.next === "reset_password") && (
                  <PasswordForm
                    pending={pending}
                    onSubmit={(password) =>
                      submit(
                        step.next === "reset_password"
                          ? {
                              action: "resetPassword",
                              data: { password, token: step.resetToken },
                            }
                          : {
                              action: "setPassword",
                              data: { password, token: step.setupToken },
                            },
                      )
                    }
                  />
                )}
              </div>
              <Button
                variant="link"
                className="w-full"
                disabled={pending}
                onClick={() => resetTo("login")}
              >
                {t.ui.back}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <FeedbackOverlay
        open={success}
        title={t.auth.success}
        durationMs={SUCCESS_OVERLAY_MS}
        onClose={complete}
      />
    </main>
  );
}
