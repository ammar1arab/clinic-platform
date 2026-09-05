import { Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { securityError } from "../security-error";

@Injectable()
export class RateLimitService {
  private cleanupAt = 0;
  constructor(private readonly prisma: PrismaService) {}

  async consume(
    scope: string,
    subject: string,
    limit: number,
    seconds: number,
  ) {
    const id = createHmac("sha256", process.env.JWT_SECRET!)
      .update(scope + ":" + subject)
      .digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + seconds * 1000);
    const [row] = await this.prisma.$queryRaw<
      { count: number; expiresAt: Date }[]
    >`
      INSERT INTO "AuthRateLimit" ("id", "count", "expiresAt") VALUES (${id}, 1, ${expiresAt})
      ON CONFLICT ("id") DO UPDATE SET
        "count" = CASE WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN 1 ELSE "AuthRateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "AuthRateLimit"."expiresAt" END
      RETURNING "count", "expiresAt"
    `;
    if (now.getTime() >= this.cleanupAt) {
      this.cleanupAt = now.getTime() + 60_000;
      await this.prisma.authRateLimit.deleteMany({
        where: { expiresAt: { lt: new Date(now.getTime() - 86_400_000) } },
      });
      await this.prisma.authOtpChallenge.deleteMany({
        where: { expiresAt: { lt: new Date(now.getTime() - 86_400_000) } },
      });
    }
    if (row.count > limit)
      securityError(
        "rateLimited",
        429,
        Math.max(
          1,
          Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000),
        ),
      );
  }
}
