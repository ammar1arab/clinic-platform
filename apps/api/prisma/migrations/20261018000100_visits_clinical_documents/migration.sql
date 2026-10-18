-- AlterTable
ALTER TABLE "ClinicUser" ADD COLUMN     "defaultNoteTemplateId" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "presenceConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "presenceConfirmedById" TEXT,
ADD COLUMN     "presenceSource" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ClinicalNoteTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "availableToAll" BOOLEAN NOT NULL DEFAULT true,
    "assignments" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalNoteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "documentationDeadlineAt" TIMESTAMP(3) NOT NULL,
    "noteStatus" TEXT NOT NULL DEFAULT 'not_started',
    "reportStatus" TEXT NOT NULL DEFAULT 'pending_note',
    "invoiceStatus" TEXT NOT NULL DEFAULT 'preparing',
    "unlockGrantedAt" TIMESTAMP(3),
    "unlockGrantedById" TEXT,
    "unlockReason" TEXT,
    "context" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "sectionsSnapshot" JSONB NOT NULL,
    "values" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "authorId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),
    "signedRevisionId" TEXT,

    CONSTRAINT "ClinicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitMedicalReport" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "sections" JSONB NOT NULL,
    "sourceNoteRevisionId" TEXT NOT NULL,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "VisitMedicalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitInvoice" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "number" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "lineItems" JSONB NOT NULL,
    "subtotal" DECIMAL(12,3) NOT NULL,
    "discount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,3) NOT NULL,
    "packageCoverage" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "prepayment" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),

    CONSTRAINT "VisitInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitPayment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "methodId" TEXT,
    "paymentId" TEXT,
    "reference" TEXT,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitDocument" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "pdf" BYTEA NOT NULL,
    "signedById" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "VisitDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalNoteTemplate_clinicId_status_idx" ON "ClinicalNoteTemplate"("clinicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNoteTemplate_id_clinicId_key" ON "ClinicalNoteTemplate"("id", "clinicId");

-- CreateIndex
CREATE INDEX "ClinicalTemplateVersion_clinicId_idx" ON "ClinicalTemplateVersion"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTemplateVersion_templateId_version_key" ON "ClinicalTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_appointmentId_key" ON "Visit"("appointmentId");

-- CreateIndex
CREATE INDEX "Visit_clinicId_startedAt_idx" ON "Visit"("clinicId", "startedAt");

-- CreateIndex
CREATE INDEX "Visit_clinicId_noteStatus_invoiceStatus_idx" ON "Visit"("clinicId", "noteStatus", "invoiceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_id_clinicId_key" ON "Visit"("id", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_appointmentId_clinicId_key" ON "Visit"("appointmentId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_visitId_key" ON "ClinicalNote"("visitId");

-- CreateIndex
CREATE INDEX "ClinicalNote_clinicId_idx" ON "ClinicalNote"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_visitId_clinicId_key" ON "ClinicalNote"("visitId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitMedicalReport_visitId_key" ON "VisitMedicalReport"("visitId");

-- CreateIndex
CREATE INDEX "VisitMedicalReport_clinicId_idx" ON "VisitMedicalReport"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitMedicalReport_visitId_clinicId_key" ON "VisitMedicalReport"("visitId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitInvoice_visitId_key" ON "VisitInvoice"("visitId");

-- CreateIndex
CREATE INDEX "VisitInvoice_clinicId_issuedAt_idx" ON "VisitInvoice"("clinicId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisitInvoice_clinicId_number_key" ON "VisitInvoice"("clinicId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "VisitInvoice_id_clinicId_key" ON "VisitInvoice"("id", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitInvoice_visitId_clinicId_key" ON "VisitInvoice"("visitId", "clinicId");

-- CreateIndex
CREATE INDEX "VisitPayment_invoiceId_idx" ON "VisitPayment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitPayment_clinicId_requestId_key" ON "VisitPayment"("clinicId", "requestId");

-- CreateIndex
CREATE INDEX "VisitEvent_clinicId_visitId_createdAt_idx" ON "VisitEvent"("clinicId", "visitId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitDocument_clinicId_visitId_idx" ON "VisitDocument"("clinicId", "visitId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitDocument_visitId_kind_revision_key" ON "VisitDocument"("visitId", "kind", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_id_clinicId_key" ON "Appointment"("id", "clinicId");

-- AddForeignKey
ALTER TABLE "ClinicalTemplateVersion" ADD CONSTRAINT "ClinicalTemplateVersion_templateId_clinicId_fkey" FOREIGN KEY ("templateId", "clinicId") REFERENCES "ClinicalNoteTemplate"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_appointmentId_clinicId_fkey" FOREIGN KEY ("appointmentId", "clinicId") REFERENCES "Appointment"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_visitId_clinicId_fkey" FOREIGN KEY ("visitId", "clinicId") REFERENCES "Visit"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitMedicalReport" ADD CONSTRAINT "VisitMedicalReport_visitId_clinicId_fkey" FOREIGN KEY ("visitId", "clinicId") REFERENCES "Visit"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitInvoice" ADD CONSTRAINT "VisitInvoice_visitId_clinicId_fkey" FOREIGN KEY ("visitId", "clinicId") REFERENCES "Visit"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPayment" ADD CONSTRAINT "VisitPayment_invoiceId_clinicId_fkey" FOREIGN KEY ("invoiceId", "clinicId") REFERENCES "VisitInvoice"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvent" ADD CONSTRAINT "VisitEvent_visitId_clinicId_fkey" FOREIGN KEY ("visitId", "clinicId") REFERENCES "Visit"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitDocument" ADD CONSTRAINT "VisitDocument_visitId_clinicId_fkey" FOREIGN KEY ("visitId", "clinicId") REFERENCES "Visit"("id", "clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Only an already-recorded consultation start can create a legacy visit.
-- Historical completed appointments are left untouched: no finish time is invented.
INSERT INTO "Visit" ("id", "clinicId", "appointmentId", "revision", "startedAt", "scheduledEndAt", "documentationDeadlineAt", "noteStatus", "reportStatus", "invoiceStatus", "context", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, a."clinicId", a."id", 0, a."inProgressAt",
 a."scheduledAt" + a."durationMins" * INTERVAL '1 minute',
 a."scheduledAt" + a."durationMins" * INTERVAL '1 minute' + INTERVAL '48 hours',
 'not_started', 'pending_note', 'preparing',
 jsonb_build_object(
  'legacyImported', true, 'patientName', p."firstNameEn" || ' ' || p."lastNameEn",
  'patientNameAr', concat_ws(' ', p."firstNameAr", p."lastNameAr"),
  'practitionerName', d."name", 'practitionerNameAr', d."nameAr", 'clinicName', c."name", 'clinicNameAr', c."nameAr",
  'timezone', c."timezone", 'mode', a."sessionType", 'scheduledAt', a."scheduledAt", 'durationMins', a."durationMins",
  'fee', COALESCE(a."fee", 0)::text, 'discount', COALESCE(a."discount", 0)::text, 'discountType', a."discountType",
  'packageCoverage', COALESCE(a."packageCredit", 0)::text, 'prepaid', a."isPaid", 'paymentMethodId', a."paymentMethodId", 'serviceName', COALESCE(s."name", 'Consultation')
 ), a."inProgressAt", CURRENT_TIMESTAMP
FROM "Appointment" a
JOIN "Clinic" c ON c."id" = a."clinicId"
JOIN "Patient" p ON p."id" = a."patientId" AND p."clinicId" = a."clinicId"
JOIN "ClinicUser" d ON d."id" = a."doctorId" AND d."clinicId" = a."clinicId"
LEFT JOIN "Service" s ON s."id" = a."serviceId" AND s."clinicId" = a."clinicId"
WHERE a."status" = 'in_progress' AND a."inProgressAt" IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM "Visit" v WHERE v."appointmentId" = a."id");

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_statuses_check" CHECK (
 "noteStatus" IN ('not_started','draft','signed') AND "reportStatus" IN ('pending_note','draft','signed')
 AND "invoiceStatus" IN ('preparing','awaiting_review','issued','void') AND "revision" >= 0
 AND "documentationDeadlineAt" = "scheduledEndAt" + INTERVAL '48 hours'
 AND ("finishedAt" IS NULL OR "finishedAt" >= "startedAt")
);
ALTER TABLE "ClinicalNoteTemplate" ADD CONSTRAINT "ClinicalNoteTemplate_status_check" CHECK ("status" IN ('draft','published','archived') AND "revision" >= 0 AND "version" >= 0);
ALTER TABLE "VisitInvoice" ADD CONSTRAINT "VisitInvoice_amounts_check" CHECK ("subtotal" >= 0 AND "discount" >= 0 AND "tax" >= 0 AND "total" >= 0 AND "packageCoverage" >= 0 AND "prepayment" >= 0 AND "revision" >= 1);
ALTER TABLE "VisitPayment" ADD CONSTRAINT "VisitPayment_amount_check" CHECK ("amount" <> 0);

CREATE INDEX "Visit_documentationDeadlineAt_noteStatus_idx" ON "Visit"("documentationDeadlineAt", "noteStatus");
CREATE INDEX "VisitEvent_visitId_kind_createdAt_idx" ON "VisitEvent"("visitId", "kind", "createdAt");
