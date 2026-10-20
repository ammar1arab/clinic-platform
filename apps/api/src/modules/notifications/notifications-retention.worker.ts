import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createLogger } from "@/infrastructure/logger";
import { NotificationsRepository } from "./notifications.repository";

const HOUR = 3_600_000;

@Injectable()
export class NotificationsRetentionWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private readonly log = createLogger("NotificationsRetention");

  constructor(private readonly repo: NotificationsRepository) {}

  onModuleInit() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), HOUR);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    try {
      await this.repo.purgeExpired();
    } catch {
      this.log.warn("notification_purge_failed");
    }
  }
}
