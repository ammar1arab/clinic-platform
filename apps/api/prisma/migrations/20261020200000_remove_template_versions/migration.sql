-- AlterTable
ALTER TABLE "ClinicalNoteTemplate" ADD COLUMN     "published" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- Keep the latest published layout of every template
UPDATE "ClinicalNoteTemplate" AS t
SET "published" = v."snapshot", "publishedAt" = v."createdAt"
FROM (
  SELECT DISTINCT ON ("templateId") "templateId", "snapshot", "createdAt"
  FROM "ClinicalTemplateVersion"
  ORDER BY "templateId", "version" DESC
) AS v
WHERE v."templateId" = t."id";

-- AlterTable
ALTER TABLE "ClinicalNote" DROP COLUMN "templateVersionId",
DROP COLUMN "templateVersion";

-- DropTable
DROP TABLE "ClinicalTemplateVersion";

-- AlterTable
ALTER TABLE "ClinicalNoteTemplate" DROP COLUMN "version";
