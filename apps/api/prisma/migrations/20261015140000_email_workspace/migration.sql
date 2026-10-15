CREATE TYPE "EmailRecipientStatus" AS ENUM (
  'queued',
  'processing',
  'accepted',
  'delivered',
  'delayed',
  'bounced',
  'complained',
  'failed',
  'suppressed'
);

CREATE TABLE "EmailSettings" (
  "clinicId" TEXT NOT NULL,
  "replyTo" TEXT,
  "websiteUrl" TEXT,
  "instagramUrl" TEXT,
  "facebookUrl" TEXT,
  "linkedinUrl" TEXT,
  "footerEn" TEXT,
  "footerAr" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("clinicId")
);

CREATE TABLE "EmailMessage" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailRecipient" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "sourceId" TEXT,
  "audience" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "replyTo" TEXT,
  "status" "EmailRecipientStatus" NOT NULL DEFAULT 'queued',
  "providerId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstAttemptAt" TIMESTAMP(3),
  "leaseToken" TEXT,
  "leaseUntil" TIMESTAMP(3),
  "lastError" TEXT,
  "lastEventAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailWebhookReceipt" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailWebhookReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailSuppression" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailMessage_clinicId_createdAt_id_idx"
ON "EmailMessage"("clinicId", "createdAt", "id");

CREATE UNIQUE INDEX "EmailMessage_clinicId_requestId_key"
ON "EmailMessage"("clinicId", "requestId");

CREATE UNIQUE INDEX "EmailRecipient_providerId_key"
ON "EmailRecipient"("providerId");

CREATE INDEX "EmailRecipient_status_nextAttemptAt_idx"
ON "EmailRecipient"("status", "nextAttemptAt");

CREATE INDEX "EmailRecipient_status_leaseUntil_idx"
ON "EmailRecipient"("status", "leaseUntil");

CREATE UNIQUE INDEX "EmailRecipient_messageId_email_key"
ON "EmailRecipient"("messageId", "email");

CREATE INDEX "EmailWebhookReceipt_createdAt_idx"
ON "EmailWebhookReceipt"("createdAt");

CREATE UNIQUE INDEX "EmailSuppression_clinicId_email_key"
ON "EmailSuppression"("clinicId", "email");

ALTER TABLE "EmailSettings"
ADD CONSTRAINT "EmailSettings_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailMessage"
ADD CONSTRAINT "EmailMessage_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailRecipient"
ADD CONSTRAINT "EmailRecipient_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailSuppression"
ADD CONSTRAINT "EmailSuppression_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
