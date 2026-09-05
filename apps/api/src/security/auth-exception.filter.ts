import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Response } from "express";

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const value = exception.getResponse();
    const body =
      typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : { message: value };
    const response = host.switchToHttp().getResponse<Response>();
    if (status === 429 && typeof body.retryAfterSeconds === "number")
      response.setHeader("Retry-After", body.retryAfterSeconds);
    response
      .status(status)
      .json(
        status === 400 && !body.code
          ? { code: "invalidRequest", message: "invalidRequest" }
          : body,
      );
  }
}
