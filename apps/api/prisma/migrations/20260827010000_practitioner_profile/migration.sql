-- AlterEnum
CREATE TYPE "EmploymentType" AS ENUM ('salaried', 'commission', 'mixed');

-- AlterTable
ALTER TABLE "ClinicUser" ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "bioAr" TEXT,
ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER,
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT,
ADD COLUMN IF NOT EXISTS "licenseExpiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
ADD COLUMN IF NOT EXISTS "defaultRoomId" TEXT,
ADD COLUMN IF NOT EXISTS "employmentType" "EmploymentType",
ADD COLUMN IF NOT EXISTS "bufferMins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ClinicUserService" (
    "id" TEXT NOT NULL,
    "clinicUserId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "ClinicUserService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ClinicUserService_clinicUserId_serviceId_key" ON "ClinicUserService"("clinicUserId", "serviceId");
CREATE INDEX IF NOT EXISTS "ClinicUserService_serviceId_idx" ON "ClinicUserService"("serviceId");
CREATE INDEX IF NOT EXISTS "ClinicUser_clinicId_role_idx" ON "ClinicUser"("clinicId", "role");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ClinicUser" ADD CONSTRAINT "ClinicUser_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ClinicUser" ADD CONSTRAINT "ClinicUser_defaultRoomId_fkey" FOREIGN KEY ("defaultRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ClinicUserService" ADD CONSTRAINT "ClinicUserService_clinicUserId_fkey" FOREIGN KEY ("clinicUserId") REFERENCES "ClinicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ClinicUserService" ADD CONSTRAINT "ClinicUserService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
