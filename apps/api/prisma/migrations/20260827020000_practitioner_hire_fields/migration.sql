-- AlterTable
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClinicUser" ADD COLUMN "title" TEXT;
ALTER TABLE "ClinicUser" ADD COLUMN "commissionPercent" DECIMAL(5,2);
ALTER TABLE "ClinicUser" ADD COLUMN "calendarColor" TEXT;
