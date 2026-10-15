"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { useLanguage } from "@/providers";
import { OtpVerificationForm } from "./otp-verification-form";

export function AccountVerificationDialog({
  open,
  pending,
  resendAt,
  error,
  onClose,
  onVerify,
  onResend,
}: {
  open: boolean;
  pending: boolean;
  resendAt: number;
  error: string;
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
