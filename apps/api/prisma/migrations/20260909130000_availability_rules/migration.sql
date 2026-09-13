ALTER TABLE "DoctorAvailability"
  ADD COLUMN "effectiveFrom" DATE,
  ADD COLUMN "effectiveUntil" DATE;

CREATE INDEX "DoctorAvailability_doctorId_dayOfWeek_isActive_idx"
  ON "DoctorAvailability"("doctorId", "dayOfWeek", "isActive");

CREATE INDEX "DoctorTimeOff_doctorId_startDate_endDate_idx"
  ON "DoctorTimeOff"("doctorId", "startDate", "endDate");

CREATE TABLE "DoctorAvailabilityOverride" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DoctorAvailabilityOverride_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DoctorAvailabilityOverride_doctorId_startAt_endAt_idx"
  ON "DoctorAvailabilityOverride"("doctorId", "startAt", "endAt");

ALTER TABLE "DoctorAvailabilityOverride"
  ADD CONSTRAINT "DoctorAvailabilityOverride_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "ClinicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
