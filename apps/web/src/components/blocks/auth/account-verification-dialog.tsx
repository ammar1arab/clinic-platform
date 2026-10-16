"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { useLanguage } from "@/providers";
import { OtpVerificationForm } from "./otp-verification-form";

export function AccountVerificationDialog({
  open,
  pending,
  resendAt,
  error,
  email,
  onClose,
  onVerify,
  onResend,
}: {
  open: boolean;
  pending: boolean;
  resendAt: number;
  error: string;
  email?: string;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const { t } = useLanguage();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next || pending) return;
        onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{t.auth.verifyEmail}</DialogTitle>
        {open && (
          <>
            {email ? (
              <p className="text-center text-sm text-muted-foreground">
                {t.auth.codeSent} <bdi className="font-medium text-foreground">{email}</bdi>
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <OtpVerificationForm
              pending={pending}
              resendAt={resendAt}
              onVerify={onVerify}
              onResend={onResend}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
