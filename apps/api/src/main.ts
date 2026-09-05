import "dotenv/config";
import "tsconfig-paths/register";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { corsOrigin, createLogger } from "./infrastructure";

async function bootstrap() {
  const log = createLogger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0)
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
  app.set("trust proxy", proxyHops);
  app.useLogger(new Logger());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Clinic Platform API")
    .setDescription("Owner module API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  log.info("listening", { port });
}
void bootstrap();
