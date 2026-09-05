import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { RateLimitService } from "../services/rate-limit.service";

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(private readonly limits: RateLimitService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    try {
      await this.limits.consume(
        "auth-ip",
        request.ip ?? request.socket.remoteAddress ?? "unknown",
        60,
        900,
      );
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) {
        const body = error.getResponse() as { retryAfterSeconds: number };
        context
          .switchToHttp()
          .getResponse<Response>()
          .setHeader("Retry-After", body.retryAfterSeconds);
      }
      throw error;
    }
    return true;
  }
}
