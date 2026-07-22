-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "primaryDoctorId" TEXT;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_primaryDoctorId_fkey" FOREIGN KEY ("primaryDoctorId") REFERENCES "ClinicUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
