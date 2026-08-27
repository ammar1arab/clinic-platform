import { Logger as NestLogger } from "@nestjs/common";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogMetaValue =
  | string
  | number
  | boolean
  | null
  | LogMetaValue[]
  | { [key: string]: LogMetaValue | undefined };

export type LogMeta =
  string | Error | { [key: string]: LogMetaValue | undefined };

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
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
};

const nest = new NestLogger("App");

const emit = (
  level: LogLevel,
  scope: string,
  action: string,
  meta?: LogMeta,
): void => {
  const line = meta
    ? `[${scope}.${action}] ${stringify(meta)}`
    : `[${scope}.${action}]`;

  if (level === "error") nest.error(line);
  else if (level === "warn") nest.warn(line);
  else if (level === "debug") nest.debug(line);
  else nest.log(line);
};

export const logger: Logger = {
  debug: (scope, action, meta) => emit("debug", scope, action, meta),
  info: (scope, action, meta) => emit("info", scope, action, meta),
  warn: (scope, action, meta) => emit("warn", scope, action, meta),
  error: (scope, action, meta) => emit("error", scope, action, meta),
};

export function createLogger(scope: string): ScopedLogger {
  return {
    debug: (action, meta) => logger.debug(scope, action, meta),
    info: (action, meta) => logger.info(scope, action, meta),
    warn: (action, meta) => logger.warn(scope, action, meta),
    error: (action, meta) => logger.error(scope, action, meta),
  };
}
