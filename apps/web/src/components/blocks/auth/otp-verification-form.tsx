'use client';

import { useState } from 'react';
import { AUTH_POLICY } from '@clinic/types';
import { Button } from '@/components/ui';
import { ButtonSpinner } from '@/components/primitives';
import { OtpInput } from '@/components/primitives/forms/otp-input';
import { useLanguage } from '@/providers/language-provider';
import { useNow } from '@/hooks/shared/use-now';
import { prepareFeedbackSound } from '@/lib/feedback-sound';

export function OtpVerificationForm({
  pending,
  resendAt,
  onVerify,
  onResend,
}: {
  pending: boolean;
  resendAt: number;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const { t } = useLanguage();
  const now = useNow(1000).getTime();
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const [code, setCode] = useState('');

  const submit = (next: string) => {
    if (pending || next.length !== AUTH_POLICY.otpDigits) return;
    prepareFeedbackSound();
    void onVerify(next);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit(code);
      }}
    >
      <OtpInput
        value={code}
        onChange={(next) => {
          setCode(next);
          submit(next);
        }}
        length={AUTH_POLICY.otpDigits}
        aria-label={t.auth.otpLabel}
        disabled={pending}
      />
      <p className="text-xs text-muted-foreground">{t.auth.otpExpiry}</p>
      <Button
        type="submit"
        className="w-full"
        disabled={pending || code.length !== AUTH_POLICY.otpDigits}
      >
        {pending && <ButtonSpinner />}
        {t.auth.verify}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={pending || remaining > 0}
        onClick={() => {
          setCode('');
          void onResend();
        }}
      >
        {remaining
          ? t.auth.resendIn.replace('{seconds}', String(remaining))
          : t.auth.resend}
      </Button>
    </form>
  );
}
