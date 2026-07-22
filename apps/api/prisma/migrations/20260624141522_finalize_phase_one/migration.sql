/*
  Warnings:

  - The values [inperson] on the enum `SessionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bio` on the `ClinicUser` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `ClinicUser` table. All the data in the column will be lost.
  - You are about to drop the column `bgColor` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Department` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('referral', 'consultation');

-- CreateEnum
CREATE TYPE "ReferralUrgency" AS ENUM ('normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "SessionType_new" AS ENUM ('in_person', 'online');
ALTER TABLE "public"."Appointment" ALTER COLUMN "sessionType" DROP DEFAULT;
ALTER TABLE "public"."Clinic" ALTER COLUMN "defaultSessionType" DROP DEFAULT;
ALTER TABLE "Clinic" ALTER COLUMN "defaultSessionType" TYPE "SessionType_new" USING ("defaultSessionType"::text::"SessionType_new");
ALTER TABLE "Appointment" ALTER COLUMN "sessionType" TYPE "SessionType_new" USING ("sessionType"::text::"SessionType_new");
ALTER TYPE "SessionType" RENAME TO "SessionType_old";
ALTER TYPE "SessionType_new" RENAME TO "SessionType";
DROP TYPE "public"."SessionType_old";
ALTER TABLE "Appointment" ALTER COLUMN "sessionType" SET DEFAULT 'in_person';
ALTER TABLE "Clinic" ALTER COLUMN "defaultSessionType" SET DEFAULT 'in_person';
COMMIT;

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "sessionType" SET DEFAULT 'in_person';

-- AlterTable
ALTER TABLE "Clinic" ALTER COLUMN "defaultSessionType" SET DEFAULT 'in_person';

-- AlterTable
ALTER TABLE "ClinicUser" DROP COLUMN "bio",
DROP COLUMN "color";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "bgColor",
DROP COLUMN "color",
DROP COLUMN "sortOrder",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "fromDoctorId" TEXT NOT NULL,
    "toDoctorId" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL DEFAULT 'referral',
    "urgency" "ReferralUrgency" NOT NULL DEFAULT 'normal',
    "reason" TEXT NOT NULL,
    "opinion" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_fromDoctorId_fkey" FOREIGN KEY ("fromDoctorId") REFERENCES "ClinicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_toDoctorId_fkey" FOREIGN KEY ("toDoctorId") REFERENCES "ClinicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
