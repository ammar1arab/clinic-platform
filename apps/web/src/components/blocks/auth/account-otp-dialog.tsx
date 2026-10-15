"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { CopyButton } from "@/components/primitives";
import { OtpInput } from "@/components/primitives/forms/otp-input";
import { useLanguage } from "@/providers";
import type { OwnerOtpResponse } from "@clinic/types";
import { formatTime } from "@/lib/datetime";

export function AccountOtpDialog({
  code,
  onClose,
}: {
  code: OwnerOtpResponse | undefined;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{t.common.generateOtp}</DialogTitle>
        {code && (
          <>
            <div className="group/contact flex items-center gap-3 [&_button]:opacity-100">
              <div className="min-w-0 flex-1">
                <OtpInput
                  value={code.code}
                  onChange={() => {}}
                  readOnly
                  autoFocus={false}
                  aria-label={t.common.generateOtp}
                />
              </div>
              <CopyButton value={code.code} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t.common.otpExpiry} {formatTime(code.expiresAt, undefined, lang)}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
