import "dotenv/config";
import "tsconfig-paths/register";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { corsOrigin, createLogger } from "./infrastructure";

async function bootstrap() {
  const log = createLogger("Bootstrap");
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
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
