import { AUTH_COOKIE_NAME, AUTH_TOKEN_MAX_AGE } from '@/constants/auth';

function readCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${AUTH_COOKIE_NAME}=`;
  const row = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  if (!row) return null;
  const raw = row.slice(prefix.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw || null;
  }
}

function writeCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (!token) {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    return;
  }
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_TOKEN_MAX_AGE}; samesite=lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_COOKIE_NAME);
  if (stored) return stored;
  const cookie = readCookieToken();
  if (cookie) localStorage.setItem(AUTH_COOKIE_NAME, cookie);
  return cookie;
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
  writeCookie(token);
  window.dispatchEvent(new Event('auth_change'));
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_COOKIE_NAME);
  writeCookie(null);
  window.dispatchEvent(new Event('auth_change'));
}

export function bearerFromConfig(headers: unknown): string {
  if (!headers || typeof headers !== 'object') return '';
  const record = headers as Record<string, unknown>;
  const raw = record.Authorization ?? record.authorization;
  const value = typeof raw === 'string' ? raw : raw != null ? String(raw) : '';
  return value.replace(/^Bearer\s+/i, '');
}
