import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Response } from "express";
import { VISIT_ERROR_MESSAGES, type VisitErrorCode } from "@clinic/types";
import { getLocale } from "@/infrastructure/i18n.context";
const errorBody = (code: VisitErrorCode) => ({
  code,
  message: VISIT_ERROR_MESSAGES[code][getLocale()],
});
export function visitError(code: VisitErrorCode, status = 400): never {
  throw new HttpException(errorBody(code), status);
}
@Catch(HttpException)
export class VisitExceptionFilter implements ExceptionFilter {
  catch(error: HttpException, host: ArgumentsHost) {
    const status = error.getStatus();
    const body = error.getResponse();
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader("Cache-Control", "no-store");
    response
      .status(status)
      .json(
        typeof body === "object" && body !== null && "code" in body
          ? body
          : errorBody(
              status === 403
                ? "visitForbidden"
                : status === 404
                  ? "visitNotFound"
                  : "visitInvalidRequest",
            ),
      );
  }
}
