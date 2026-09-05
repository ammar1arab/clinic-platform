'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { FormField, ButtonSpinner } from '@/components/primitives';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { authService } from '@/services/auth.service';
import { useAuth, useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { accessToken } = await authService.login(data.email, data.password);
      await login(accessToken);
      toast.success(t.auth.welcomeBack);
      router.push(ROUTES.DASHBOARD);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-dvh place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm" aura>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label={t.auth.email} htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                autoComplete="email"
                {...register('email')}
              />
            </FormField>
            <FormField label={t.auth.password} htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                autoComplete="current-password"
                {...register('password')}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <ButtonSpinner />}
              {loading ? t.auth.signingIn : t.auth.signIn}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
