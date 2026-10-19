BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE "ClinicalNoteTemplate"
  DROP CONSTRAINT "ClinicalNoteTemplate_status_check",
  ADD CONSTRAINT "ClinicalNoteTemplate_status_check"
    CHECK ("status" IN ('draft', 'scheduled', 'published', 'archived') AND "revision" >= 0 AND "version" >= 0);
COMMIT;
