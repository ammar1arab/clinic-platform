import { Injectable, OnModuleInit } from "@nestjs/common";
import { createHash, createHmac } from "crypto";
import { createLogger } from "./logger";

export interface UploadObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly log = createLogger(StorageService.name);
  private enabled = false;
  private accountId = "";
  private accessKeyId = "";
  private secretAccessKey = "";
  private bucket = "";
  private publicBaseUrl = "";

  onModuleInit() {
    this.accountId = process.env.R2_ACCOUNT_ID ?? "";
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
    this.bucket = process.env.R2_BUCKET ?? "";
    this.publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(
      /\/$/,
      "",
    );
    this.enabled = !!(
      this.accountId &&
      this.accessKeyId &&
      this.secretAccessKey &&
      this.bucket
    );
    if (!this.enabled) {
      this.log.warn("not_configured");
    }
  }

  get isEnabled() {
    return this.enabled;
  }

  async upload(
    input: UploadObjectInput,
  ): Promise<{ key: string; url: string; skipped?: boolean }> {
    if (!this.enabled) {
      this.log.debug("skipped", { key: input.key });
      return { key: input.key, url: input.key, skipped: true };
    }

    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${this.bucket}/${input.key}`;
    const amzDate = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = createHash("sha256").update(input.body).digest("hex");
    const region = "auto";
    const service = "s3";

    const canonicalHeaders =
      `content-type:${input.contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "PUT",
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    const signingKey = this.getSignatureKey(
      this.secretAccessKey,
      dateStamp,
      region,
      service,
    );
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(`https://${host}${canonicalUri}`, {
      method: "PUT",
      headers: {
        "Content-Type": input.contentType,
        Host: host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authorization,
      },
      body: new Uint8Array(input.body),
    });

    if (!res.ok) {
      const text = await res.text();
      this.log.error("upload_failed", { status: res.status, text });
      throw new Error(`R2 upload failed: ${res.status}`);
    }

    const url = this.publicBaseUrl
      ? `${this.publicBaseUrl}/${input.key}`
      : `https://${host}${canonicalUri}`;

    return { key: input.key, url };
  }

  private getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
  ) {
    const kDate = createHmac("sha256", `AWS4${key}`).update(dateStamp).digest();
    const kRegion = createHmac("sha256", kDate).update(regionName).digest();
    const kService = createHmac("sha256", kRegion).update(serviceName).digest();
    return createHmac("sha256", kService).update("aws4_request").digest();
  }
}
