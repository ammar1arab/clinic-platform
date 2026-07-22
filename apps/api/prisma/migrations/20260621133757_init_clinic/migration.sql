-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('inperson', 'online');

-- CreateEnum
CREATE TYPE "CalendarView" AS ENUM ('day', 'week');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "workingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '20:00',
    "defaultCalendarView" "CalendarView" NOT NULL DEFAULT 'week',
    "defaultSessionType" "SessionType" NOT NULL DEFAULT 'inperson',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);
