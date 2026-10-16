import {
  ForbiddenException,
  HttpException,
  Injectable,
  type ExecutionContext,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import type { AuthUser } from "../types";
import { securityError } from "@/security/security-error";
import {
  clearAuthCookie,
  isTrustedBrowserOrigin,
  readAuthCookie,
} from "@/security/auth-cookie";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    const response = context.switchToHttp().getResponse<Response>();
    const hasBearer = Boolean(request.headers.authorization);
    const hasCookie = Boolean(readAuthCookie(request.headers.cookie));
    try {
      if (!(await super.canActivate(context))) return false;
    } catch (error) {
      if (
        !hasBearer &&
        hasCookie &&
        error instanceof HttpException &&
        error.getStatus() === 401
      ) {
        clearAuthCookie(response);
      }
      throw error;
    }
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method);
    if (
      !hasBearer &&
      hasCookie &&
      !isSafeMethod &&
      !isTrustedBrowserOrigin(request.headers.origin)
    ) {
      throw new ForbiddenException("Invalid request origin");
    }
    for (const input of [request.query, request.body as unknown]) {
      if (input && typeof input === "object" && "clinicId" in input) {
        if (input.clinicId !== request.user.clinicId) {
          securityError("clinicUnavailable", 403);
        }
      }
    }
    return true;
  }
}
