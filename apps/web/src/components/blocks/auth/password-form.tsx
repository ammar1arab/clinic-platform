'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordRequirements } from '@clinic/types';
import { getTranslations } from '@/i18n';
import { Button } from '@/components/ui';
import { ButtonSpinner } from '@/components/primitives';
import { FloatingInput } from '@/components/primitives/forms/floating-input';
import { useLanguage } from '@/providers/language-provider';
import { prepareFeedbackSound } from '@/lib/feedback-sound';

const schema = z.object({
  password: z.string().refine(value => Object.values(passwordRequirements(value)).every(Boolean), { error: () => getTranslations().auth.errors.weakPassword }),
  confirm: z.string(),
}).refine(value => value.password === value.confirm, { path: ['confirm'], error: () => getTranslations().auth.passwordMismatch });

export function PasswordForm({ pending, onSubmit }: { pending: boolean; onSubmit: (password: string) => Promise<void> }) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' },
  });
  return (
    <form className="space-y-5" onSubmit={handleSubmit(data => { prepareFeedbackSound(); return onSubmit(data.password); })} noValidate>
      <FloatingInput label={t.auth.newPassword} type="password" autoComplete="new-password" autoFocus disabled={pending}
        error={errors.password?.message} {...register('password')} />
      <FloatingInput label={t.auth.confirmPassword} type="password" autoComplete="new-password" disabled={pending}
        error={errors.confirm?.message} {...register('confirm')} />
      <Button type="submit" className="w-full" disabled={pending}>{pending && <ButtonSpinner />}{t.auth.savePassword}</Button>
    </form>
  );
}
