-- Set schema default + migrate existing clinics to month
ALTER TABLE "Clinic" ALTER COLUMN "defaultCalendarView" SET DEFAULT 'month'::"CalendarView";
UPDATE "Clinic" SET "defaultCalendarView" = 'month' WHERE "defaultCalendarView" IS DISTINCT FROM 'month';
