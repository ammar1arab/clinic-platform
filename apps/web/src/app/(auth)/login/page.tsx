import { cookies } from 'next/headers';
import { AuthFlow } from '@/components/blocks/auth/auth-flow';
import { AUTH_COOKIE_NAME } from '@/constants/auth';

export default async function LoginPage() {
  const hasSession = (await cookies()).has(AUTH_COOKIE_NAME);
  return <AuthFlow hasSession={hasSession} />;
}
