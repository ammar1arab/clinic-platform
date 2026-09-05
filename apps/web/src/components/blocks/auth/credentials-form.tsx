'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui';
import { ButtonSpinner } from '@/components/primitives';
import { FloatingInput } from '@/components/primitives/forms/floating-input';
import { useLanguage } from '@/providers/language-provider';
import { prepareFeedbackSound } from '@/lib/feedback-sound';

export function CredentialsForm({ recovery, pending, onSubmit }: {
  recovery: boolean; pending: boolean; onSubmit: (data: { email: string; password: string }) => Promise<void>;
}) {
  const { t } = useLanguage();
  const schema = loginSchema.extend({ password: recovery ? z.string() : loginSchema.shape.password });
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { email: '', password: '' },
  });
  return (
    <form onSubmit={handleSubmit(data => { prepareFeedbackSound(); return onSubmit(data); })} className="space-y-5" noValidate>
      <FloatingInput label={t.auth.email} type="email" autoComplete="email" dir="ltr" autoFocus
        disabled={pending} error={errors.email?.message} {...register('email')} />
      {!recovery && <FloatingInput label={t.auth.password} type="password" autoComplete="current-password"
        disabled={pending} error={errors.password?.message} {...register('password')} />}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <ButtonSpinner />}{recovery ? t.auth.sendCode : t.auth.signIn}
      </Button>
    </form>
  );
}
