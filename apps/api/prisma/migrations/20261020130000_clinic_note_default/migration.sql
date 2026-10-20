ALTER TABLE "Clinic" ADD COLUMN "defaultNoteTemplateId" TEXT;
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_defaultNoteTemplateId_id_fkey"
  FOREIGN KEY ("defaultNoteTemplateId", "id") REFERENCES "ClinicalNoteTemplate"("id", "clinicId")
  ON DELETE RESTRICT ON UPDATE NO ACTION;
