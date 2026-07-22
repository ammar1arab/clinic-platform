-- AlterTable
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "discountCodeId" TEXT;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
