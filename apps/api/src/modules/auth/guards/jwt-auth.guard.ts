import { Injectable, type ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import type { AuthUser } from "../types";
import { securityError } from "@/security/security-error";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await super.canActivate(context))) return false;
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
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
