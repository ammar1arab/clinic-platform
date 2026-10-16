"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { CopyButton } from "@/components/primitives";
import { OtpInput } from "@/components/primitives/forms/otp-input";
import { useLanguage } from "@/providers";
import type { OwnerOtpResponse } from "@clinic/types";

export function AccountOtpDialog({
  code,
  onClose,
}: {
  code: OwnerOtpResponse | undefined;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{t.common.generateOtp}</DialogTitle>
        {code && (
          <div className="flex flex-col gap-4">
            <OtpInput
              value={code.code}
              onChange={() => {}}
              readOnly
              autoFocus={false}
              aria-label={t.common.generateOtp}
            />
            <CopyButton value={code.code} variant="action" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
