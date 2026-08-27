import { Injectable, OnModuleInit } from "@nestjs/common";
import { createLogger } from "./logger";

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly log = createLogger(RedisService.name);
  private baseUrl?: string;
  private token?: string;
  private enabled = false;

  onModuleInit() {
    this.baseUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.enabled = !!(this.baseUrl && this.token);
    if (!this.enabled) {
      this.log.warn("not_configured");
    }
  }

  get isEnabled() {
    return this.enabled;
  }

  private async command<T>(...args: (string | number)[]): Promise<T | null> {
    if (!this.enabled || !this.baseUrl || !this.token) return null;
    const res = await fetch(`${this.baseUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      this.log.error("command_failed", { status: res.status });
      return null;
    }
    const json = (await res.json()) as { result: T };
    return json.result;
  }

  async get(key: string): Promise<string | null> {
    return this.command<string>("GET", key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.command("SET", key, value, "EX", ttlSeconds);
    } else {
      await this.command("SET", key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.command("DEL", key);
  }
}
