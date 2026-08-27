import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogMetaValue =
  | string
  | number
  | boolean
  | null
  | LogMetaValue[]
  | { [key: string]: LogMetaValue | undefined };

export type LogMeta =
  | string
  | Error
  | { [key: string]: LogMetaValue | undefined };

export interface Logger {
  debug(scope: string, action: string, meta?: LogMeta): void;
  info(scope: string, action: string, meta?: LogMeta): void;
  warn(scope: string, action: string, meta?: LogMeta): void;
  error(scope: string, action: string, meta?: LogMeta): void;
}

export type ScopedLogger = {
  debug: (action: string, meta?: LogMeta) => void;
  info: (action: string, meta?: LogMeta) => void;
  warn: (action: string, meta?: LogMeta) => void;
  error: (action: string, meta?: LogMeta) => void;
};

const stringify = (value: LogMeta): string => {
  if (value instanceof Error) return value.message;
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

const emit = (
  level: LogLevel,
  scope: string,
  action: string,
  meta?: LogMeta,
): void => {
  const ts = new Date().toISOString();
  const msg = `[${ts}] [${level.toUpperCase()}] [${scope}.${action}]`;
  const out = meta ? `${msg} ${stringify(meta)}` : msg;
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.log;
  fn(out);

  if (level === 'error') {
    const err =
      meta instanceof Error
        ? meta
        : new Error(
            `[${scope}.${action}] ${typeof meta === 'string' ? meta : stringify(meta ?? '')}`,
          );
    Sentry.withScope((sentryScope: Sentry.Scope) => {
      sentryScope.setTag('scope', scope);
      sentryScope.setTag('action', action);
      Sentry.captureException(err);
    });
  }
};

export const logger: Logger = {
  debug: (scope, action, meta) => emit('debug', scope, action, meta),
  info: (scope, action, meta) => emit('info', scope, action, meta),
  warn: (scope, action, meta) => emit('warn', scope, action, meta),
  error: (scope, action, meta) => emit('error', scope, action, meta),
};

export function createLogger(scope: string): ScopedLogger {
  return {
    debug: (action, meta) => logger.debug(scope, action, meta),
    info: (action, meta) => logger.info(scope, action, meta),
    warn: (action, meta) => logger.warn(scope, action, meta),
    error: (action, meta) => logger.error(scope, action, meta),
  };
}
