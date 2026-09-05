import { HttpException } from "@nestjs/common";
import type { AuthErrorCode } from "@clinic/types";

export function securityError(
  code: AuthErrorCode,
  status = 400,
  retryAfterSeconds?: number,
): never {
  throw new HttpException(
    {
      code,
      message: code,
      ...(retryAfterSeconds !== undefined && { retryAfterSeconds }),
    },
    status,
  );
}
