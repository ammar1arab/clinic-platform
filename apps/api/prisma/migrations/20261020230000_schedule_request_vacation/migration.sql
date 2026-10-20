ALTER TABLE "PractitionerScheduleRequest" DROP CONSTRAINT "PractitionerScheduleRequest_kind_check";
ALTER TABLE "PractitionerScheduleRequest" ADD CONSTRAINT "PractitionerScheduleRequest_kind_check" CHECK ("kind" IN ('extra', 'leave', 'vacation'));
