-- CreateTable
CREATE TABLE IF NOT EXISTS "PatientPackage" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "sessionsTotal" INTEGER,
    "creditTotal" DECIMAL(10,3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientPackage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "patientPackageId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "packageCredit" DECIMAL(10,3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PatientPackage_clinicId_patientId_isActive_idx" ON "PatientPackage"("clinicId", "patientId", "isActive");
CREATE INDEX IF NOT EXISTS "Appointment_clinicId_patientId_isPaid_idx" ON "Appointment"("clinicId", "patientId", "isPaid");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PatientPackage" ADD CONSTRAINT "PatientPackage_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientPackage" ADD CONSTRAINT "PatientPackage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PatientPackage" ADD CONSTRAINT "PatientPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientPackageId_fkey" FOREIGN KEY ("patientPackageId") REFERENCES "PatientPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: patients already assigned a package get an enrollment snapshotted from the
-- catalog, so their existing assignment carries a real balance instead of nothing.
INSERT INTO "PatientPackage" ("id", "clinicId", "patientId", "packageId", "sessionsTotal", "creditTotal", "isActive", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    p."clinicId",
    p."id",
    pkg."id",
    pkg."sessionCount",
    CASE WHEN pkg."sessionCount" IS NULL THEN pkg."price" END,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Patient" p
JOIN "Package" pkg ON pkg."id" = p."packageId"
WHERE p."packageId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "PatientPackage" pp
    WHERE pp."patientId" = p."id" AND pp."packageId" = p."packageId" AND pp."isActive"
  );
