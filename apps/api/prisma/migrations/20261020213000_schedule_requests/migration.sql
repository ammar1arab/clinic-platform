CREATE TABLE "PractitionerScheduleRequest" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "reviewNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PractitionerScheduleRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PractitionerScheduleRequest_kind_check" CHECK ("kind" IN ('extra', 'leave')),
  CONSTRAINT "PractitionerScheduleRequest_status_check" CHECK ("status" IN ('pending', 'approved', 'declined', 'withdrawn')),
  CONSTRAINT "PractitionerScheduleRequest_range_check" CHECK ("endAt" > "startAt"),
  CONSTRAINT "PractitionerScheduleRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "ClinicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PractitionerScheduleRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ClinicUser"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PractitionerScheduleRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PractitionerScheduleRequest_clinicId_status_createdAt_idx" ON "PractitionerScheduleRequest"("clinicId", "status", "createdAt");
CREATE INDEX "PractitionerScheduleRequest_doctorId_createdAt_idx" ON "PractitionerScheduleRequest"("doctorId", "createdAt");
