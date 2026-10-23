ALTER TABLE "DoctorTimeOff" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'leave';

ALTER TABLE "DoctorTimeOff"
  ADD CONSTRAINT "DoctorTimeOff_kind_check"
  CHECK ("kind" IN ('leave', 'vacation'));
