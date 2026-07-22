/*
  Warnings:

  - The `discountType` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('fixed', 'percentage');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "statusReason" TEXT,
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedBy" TEXT,
DROP COLUMN "discountType",
ADD COLUMN     "discountType" "DiscountType";

-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "supportedModes" "SessionType"[] DEFAULT ARRAY['in_person', 'online']::"SessionType"[];

-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorTimeOff" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "DoctorTimeOff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "ClinicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorTimeOff" ADD CONSTRAINT "DoctorTimeOff_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "ClinicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
