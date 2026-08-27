import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { EmailService } from "./email.service";
import { StorageService } from "./storage.service";

@Global()
@Module({
  providers: [RedisService, EmailService, StorageService],
  exports: [RedisService, EmailService, StorageService],
})
export class InfrastructureModule {}
