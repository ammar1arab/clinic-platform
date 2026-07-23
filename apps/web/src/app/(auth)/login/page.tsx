'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/primitives/form-field';
import { ButtonSpinner } from '@/components/blocks/feedback/button-spinner';
import { api } from '@/lib/api';
import { useAuth } from '@/providers';
import { ROUTES } from '@/constants/routes';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      await login(response.data.accessToken);
      toast.success('Welcome back!');
      router.push(ROUTES.DASHBOARD);
    } catch {
      // error toast is handled automatically by api.ts interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-screen place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm" aura>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Clinic Platform</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                placeholder="owner@clinic.com"
                autoComplete="email"
                {...register('email')}
              />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <ButtonSpinner />}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}