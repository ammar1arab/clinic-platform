-- Sick leave dates, report type, purpose and reference number for visit medical reports.
ALTER TABLE "VisitMedicalReport"
  ADD COLUMN "reportType" TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN "restFrom" DATE,
  ADD COLUMN "restTo" DATE,
  ADD COLUMN "purpose" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "referenceNumber" TEXT;

UPDATE "VisitMedicalReport"
SET "referenceNumber" = 'MR-' || upper(substr(md5(id), 1, 8))
WHERE "referenceNumber" IS NULL;

ALTER TABLE "VisitMedicalReport" ALTER COLUMN "referenceNumber" SET NOT NULL;

CREATE UNIQUE INDEX "VisitMedicalReport_referenceNumber_key" ON "VisitMedicalReport"("referenceNumber");
