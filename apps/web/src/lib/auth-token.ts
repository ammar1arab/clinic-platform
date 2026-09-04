import { AUTH_COOKIE_NAME, AUTH_TOKEN_MAX_AGE } from '@/constants/auth';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_COOKIE_NAME);
}

export function getServerTokenSnapshot(): string | null {
  return null;
}

export function subscribeToToken(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('auth_change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('auth_change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_COOKIE_NAME, token);
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${AUTH_TOKEN_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new Event('auth_change'));
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_COOKIE_NAME);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  window.dispatchEvent(new Event('auth_change'));
}
