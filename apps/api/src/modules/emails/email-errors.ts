import { getSharedTranslations, SHARED_EN } from '@clinic/types';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Response } from "express";
import { getLocale } from "@/infrastructure/i18n.context";



export const emailError = (code: keyof typeof SHARED_EN.emailErrors) => ({
  code,
  message: getSharedTranslations(getLocale()).emailErrors[code],
});

@Catch(HttpException)
export class EmailExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const value = exception.getResponse();
    const body =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : { message: value };
    const response = host.switchToHttp().getResponse<Response>();
    if (status === 429 && typeof body.retryAfterSeconds === "number") {
      response.setHeader("Retry-After", body.retryAfterSeconds);
    }
    response
      .status(status)
      .json(
        status === 400 && !body.code ? emailError("invalidEmailRequest") : body,
      );
  }
}
