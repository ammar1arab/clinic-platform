import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';

/**
 * Future-facing integrations. All services boot safely without env vars.
 *
 * - RedisService   → caching (sessions, hot data) — Upstash later
 * - EmailService   → Resend for custom + automated emails later
 * - StorageService → Cloudflare R2 for images, videos, PDF/Excel later
 *
 * Also planned elsewhere (not in this module yet):
 * - Sentry (API + web) — error monitoring
 * - Firebase Cloud Messaging — push notifications (see NotificationsModule)
 * - Web: Microsoft Clarity, Google Analytics, Vercel Analytics, SEO
 */
@Global()
@Module({
  providers: [RedisService, EmailService, StorageService],
  exports: [RedisService, EmailService, StorageService],
})
export class InfrastructureModule {}
