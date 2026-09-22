"use client";

import { useCallback, useRef, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import type { AuthLoginResponse, AuthRecovery, AuthReset } from "@clinic/types";
import { Card, CardContent, Button } from "@/components/ui";
import { useAuth, useLanguage } from "@/providers";
import { useAuthMutation } from "@/hooks/api/use-auth-mutations";
import { extractErrorMessage } from "@/lib/api";
import {
  FeedbackOverlay,
  SUCCESS_OVERLAY_MS,
} from "@/components/primitives/states/feedback-overlay";
import { BrandMark } from "@/components/primitives/display/brand-mark";
import { LoadingState } from "@/components/primitives";
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

export function AuthFlow() {
  const [step, setStep] = useState<Step>({ next: "login" });
  const [resendAt, setResendAt] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const celebrating = useRef(false);
  const completing = useRef(false);
  const destRef = useRef<string>(ROUTES.DASHBOARD);
  const router = useRouter();
  const { login, user, token: sessionToken, isLoading } = useAuth();
  const { t } = useLanguage();
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
    celebrating.current = false;
    router.replace(destRef.current);
  }, [router]);

  if (sessionToken && isLoading && !success && !celebrating.current) {
    return <LoadingState variant="page" text={t.auth.signingIn} />;
  }

  if (sessionToken && user && !success && !celebrating.current) {
    redirect(postLoginPath(user.role, readReturnPath()));
  }

  const submit = async (
    command: Parameters<typeof mutation.mutateAsync>[0],
  ) => {
    setError("");
    try {
      const response = await mutation.mutateAsync(command);
      if (response.next === "ready") {
        celebrating.current = true;
        setSuccess(true);
        const me = await login(response.accessToken, response.user);
        destRef.current = postLoginPath(me.role, readReturnPath());
        return;
      }
      if (response.next === "otp")
        setResendAt(Date.now() + response.cooldownSeconds * 1000);
      setStep(response);
    } catch (cause) {
      celebrating.current = false;
      setSuccess(false);
      setError(
        extractErrorMessage(cause as Parameters<typeof extractErrorMessage>[0]),
      );
    }
  };

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
                <BrandMark size="md" />
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
                <BrandMark size="md" />
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
                {t.auth.backToLogin}
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
