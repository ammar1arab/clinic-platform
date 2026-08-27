-- AlterTable
ALTER TABLE "ClinicUser" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
