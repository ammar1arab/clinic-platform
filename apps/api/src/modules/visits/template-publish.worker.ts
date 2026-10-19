import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { TemplatesService } from "./templates.service";
import { createLogger } from "@/infrastructure/logger";
@Injectable()
export class TemplatePublishWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private active = false;
  private readonly log = createLogger("TemplatePublish");
  constructor(private readonly templates: TemplatesService) {}
  onModuleInit() {
    if (process.env.TEMPLATE_PUBLISH_ENABLED === "false") return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 60_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    if (this.active) return;
    this.active = true;
    try {
      await this.templates.promoteScheduled(new Date());
    } catch {
      this.log.warn("template_publish_failed");
    } finally {
      this.active = false;
    }
  }
}
