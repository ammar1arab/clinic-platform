import { Injectable, NotFoundException } from "@nestjs/common";
import { PatientsRepository } from "./patients.repository";
import { CreatePatientDto, UpdatePatientDto, PatientFiltersDto } from "./dto";

@Injectable()
export class PatientsService {
  constructor(private patientsRepository: PatientsRepository) {}

  create(dto: CreatePatientDto) {
    return this.patientsRepository.create(dto);
  }

  async findAll(filters: PatientFiltersDto) {
    const patients = await this.patientsRepository.findAllByClinic(filters);

    return patients.map((patient) => {
      const completedAppointments = patient.appointments;
      const totalSessions = completedAppointments.length;
      const firstVisit = completedAppointments[0]?.scheduledAt ?? null;
      const lastVisit =
        completedAppointments[completedAppointments.length - 1]?.scheduledAt ??
        null;

      return {
        id: patient.id,
        firstNameEn: patient.firstNameEn,
        lastNameEn: patient.lastNameEn,
        firstNameAr: patient.firstNameAr,
        lastNameAr: patient.lastNameAr,
        nationalId: patient.nationalId,
        phone: patient.phone,
        email: patient.email,
        dob: patient.dob,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        address: patient.address,
        primaryDoctorId: patient.primaryDoctorId,
        primaryDoctorName: patient.primaryDoctor?.name ?? null,
        packageId: patient.packageId,
        discountCodeId: patient.discountCodeId,
        package: patient.package ?? null,
        discountCode: patient.discountCode ?? null,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        totalSessions,
        firstVisit,
        lastVisit,
        isLoyal: totalSessions >= 10,
      };
    });
  }

  async findOne(id: string) {
    const patient = await this.patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundException("Patient not found");
    }

    const referrals =
      await this.patientsRepository.findReferralsByPatientId(id);
    return { ...patient, referrals };
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id);
    return this.patientsRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.patientsRepository.setActive(id, false);
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.patientsRepository.setActive(id, true);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.patientsRepository.hardDelete(id);
  }
}
