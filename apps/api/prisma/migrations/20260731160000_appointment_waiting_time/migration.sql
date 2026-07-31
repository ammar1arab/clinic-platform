-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "waitingStartedAt" TIMESTAMP(3),
ADD COLUMN "inProgressAt" TIMESTAMP(3),
ADD COLUMN "waitingMins" INTEGER;
