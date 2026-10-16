
export const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-cureva_session'
    : 'cureva_session';
