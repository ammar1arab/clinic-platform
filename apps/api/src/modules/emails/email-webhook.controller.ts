import { emailError } from "./email-errors";
import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  type RawBodyRequest,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { Resend } from "resend";
import { EmailWebhooksService } from "./email-webhooks.service";

@Controller("emails/webhooks")
export class EmailWebhookController {
  constructor(private readonly webhooks: EmailWebhooksService) {}

  @Post("resend")
  @HttpCode(200)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers("svix-id") id?: string,
    @Headers("svix-timestamp") timestamp?: string,
    @Headers("svix-signature") signature?: string,
  ) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;

    if (!secret) {
      throw new ServiceUnavailableException(
        emailError("emailWebhookUnavailable"),
      );
    }

    if (!id || !timestamp || !signature) {
      throw new UnauthorizedException(
        emailError("emailWebhookSignatureInvalid"),
      );
    }

    if (!request.rawBody) {
      throw new BadRequestException(emailError("emailWebhookBodyRequired"));
    }

    let event: ReturnType<Resend["webhooks"]["verify"]>;

    try {
      event = new Resend(
        process.env.RESEND_API_KEY || "webhook-verification",
      ).webhooks.verify({
        payload: request.rawBody.toString("utf8"),
        headers: {
          id,
          timestamp,
          signature,
        },
        webhookSecret: secret,
      });
    } catch {
      throw new UnauthorizedException(
        emailError("emailWebhookSignatureInvalid"),
      );
    }

    await this.webhooks.apply(id, event);

    return { received: true };
  }
}
