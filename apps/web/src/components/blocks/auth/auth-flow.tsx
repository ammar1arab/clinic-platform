'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthLoginResponse, AuthRecovery, AuthReset } from '@clinic/types';
import { Card, CardContent, Button } from '@/components/ui';
import { useAuth, useLanguage } from '@/providers';
import { useAuthMutation } from '@/hooks/api/use-auth-mutations';
import { extractErrorMessage } from '@/lib/api';
import { FeedbackOverlay } from '@/components/primitives/states/feedback-overlay';
import { BrandMark } from '@/components/primitives/display/brand-mark';
import { playFeedbackSound } from '@/lib/feedback-sound';
import { ROUTES } from '@/constants/routes';
import { CredentialsForm } from './credentials-form';
import { PasswordForm } from './password-form';
import { OtpVerificationForm } from './otp-verification-form';

type Step = { next: 'login' | 'forgot' } | Exclude<AuthLoginResponse, { next: 'ready' }> | AuthRecovery | AuthReset;

export function AuthFlow() {
  const [step, setStep] = useState<Step>({ next: 'login' });
  const [resendAt, setResendAt] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const completing = useRef(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const mutation = useAuthMutation();
  const pending = mutation.isPending || success;
  const recovery = step.next === 'forgot' || step.next === 'reset_password' || 'recoveryToken' in step;

  const complete = useCallback(() => {
    if (completing.current) return;
    completing.current = true;
    router.replace(ROUTES.DASHBOARD);
  }, [router]);

  const submit = async (command: Parameters<typeof mutation.mutateAsync>[0]) => {
    setError('');
    try {
      const response = await mutation.mutateAsync(command);
      if (response.next === 'ready') {
        await login(response.accessToken);
        setSuccess(true);
        playFeedbackSound();
      } else {
        if (response.next === 'otp') setResendAt(Date.now() + response.cooldownSeconds * 1000);
        setStep(response);
      }
    } catch (cause) {
      setError(extractErrorMessage(cause as Parameters<typeof extractErrorMessage>[0]));
    }
  };

  const title = step.next === 'otp' ? t.auth.verifyEmail
    : step.next === 'set_password' ? t.auth.setPassword
    : step.next === 'reset_password' ? t.auth.resetPassword
    : step.next === 'forgot' ? t.auth.forgotPassword : t.auth.title;

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-sm" aura>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandMark size="md" />
            <h1 className="font-heading text-xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {step.next === 'otp' ? (recovery ? t.auth.recoverySent : t.auth.codeSent)
                : recovery ? t.auth.recoveryDescription : t.auth.description}
            </p>
            {'email' in step && <bdi className="max-w-full break-all text-sm font-medium">{step.email}</bdi>}
          </div>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div key={step.next} className="fade-in motion-reduce:animate-none">
            {(step.next === 'login' || step.next === 'forgot') && <CredentialsForm recovery={recovery} pending={pending}
              onSubmit={data => submit(recovery ? { action: 'forgotPassword', data: { email: data.email } } : { action: 'login', data })} />}
            {step.next === 'otp' && <OtpVerificationForm pending={pending} resendAt={resendAt}
              onVerify={code => submit({ action: 'verifyOtp', data: { code, token: 'recoveryToken' in step ? step.recoveryToken : step.setupToken } })}
              onResend={() => submit({ action: 'sendOtp', data: { token: 'recoveryToken' in step ? step.recoveryToken : step.setupToken } })} />}
            {(step.next === 'set_password' || step.next === 'reset_password') && <PasswordForm pending={pending}
              onSubmit={password => submit(step.next === 'reset_password'
                ? { action: 'resetPassword', data: { password, token: step.resetToken } }
                : { action: 'setPassword', data: { password, token: step.setupToken } })} />}
          </div>
          <Button variant="link" className="w-full" disabled={pending}
            onClick={() => { setError(''); mutation.reset(); setStep({ next: step.next === 'login' ? 'forgot' : 'login' }); }}>
            {step.next === 'login' ? t.auth.forgotPassword : t.auth.backToLogin}
          </Button>
        </CardContent>
      </Card>
      <FeedbackOverlay open={success} title={t.auth.success} onClose={complete} />
    </main>
  );
}
