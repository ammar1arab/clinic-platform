import { Injectable, NotFoundException } from "@nestjs/common";
import { AppointmentsService } from "@/modules/appointments/appointments.service";
import { PatientsService } from "@/modules/patients/patients.service";
import { PractitionersService } from "@/modules/practitioners/practitioners.service";
import { PatientSortBy, SortOrder } from "@/modules/patients/dto";
import { ReportsRepository } from "./reports.repository";
import { ReportDocumentFactory } from "./report-document.factory";
import { ReportExporterFactory } from "./exporters/report-exporter.factory";
import { ExportedReport } from "./exporters/report-exporter";
import { DirectoryReportQueryDto, ReportFormatDto } from "./dto";

function dayBounds(from?: string, to?: string) {
  const fromDate = from
    ? new Date(
        `${from.includes("T") ? from.split("T")[0] : from}T00:00:00.000Z`,
      )
    : undefined;
  const toDate = to
    ? new Date(`${to.includes("T") ? to.split("T")[0] : to}T23:59:59.999Z`)
    : undefined;
  return { fromDate, toDate };
}

function periodLabel(from?: string, to?: string) {
  return from || to ? `${from ?? "…"}_${to ?? "…"}` : "all";
}

@Injectable()
export class ReportsService {
  private readonly documents = new ReportDocumentFactory();

  constructor(
    private reportsRepository: ReportsRepository,
    private exporterFactory: ReportExporterFactory,
    private patientsService: PatientsService,
    private practitionersService: PractitionersService,
    private appointmentsService: AppointmentsService,
  ) {}

  async exportPatientMedical(
    clinicId: string,
    patientId: string,
    format: ReportFormatDto = ReportFormatDto.pdf,
  ): Promise<ExportedReport> {
    const clinic = await this.requireClinic(clinicId);
    const patient = await this.reportsRepository.findPatientForMedicalReport(
      clinicId,
      patientId,
    );
    if (!patient) {
      throw new NotFoundException("Patient not found");
    }

    const doc = this.documents.buildPatientMedical({
      clinic,
      patient,
      appointments: patient.appointments,
    });

    return this.exporterFactory.export(doc, format);
  }

  async exportReferrals(params: {
    clinicId: string;
    format?: ReportFormatDto;
    patientId?: string;
    toDoctorId?: string;
    from?: string;
    to?: string;
  }): Promise<ExportedReport> {
    const {
      clinicId,
      format = ReportFormatDto.pdf,
      patientId,
      toDoctorId,
      from,
      to,
    } = params;

    const clinic = await this.requireClinic(clinicId);
    const { fromDate, toDate } = dayBounds(from, to);

    const referrals = await this.reportsRepository.findReferralsForReport({
      clinicId,
      patientId,
      toDoctorId,
      from: fromDate,
      to: toDate,
    });

    const filterBits = [
      patientId ? "patient" : "",
      toDoctorId ? "inbox" : "",
      from || to ? `${from ?? "…"}_${to ?? "…"}` : "",
    ].filter(Boolean);

    const doc = this.documents.buildReferrals({
      clinic,
      referrals,
      filtersLabel: filterBits.join("-") || "all",
    });

    return this.exporterFactory.export(doc, format);
  }

  async exportFinance(params: {
    clinicId: string;
    format?: ReportFormatDto;
    from?: string;
    to?: string;
  }): Promise<ExportedReport> {
    const { clinicId, format = ReportFormatDto.pdf, from, to } = params;

    const clinic = await this.requireClinic(clinicId);
    const { fromDate, toDate } = dayBounds(from, to);

    const appointments =
      await this.reportsRepository.findAppointmentsForFinanceReport({
        clinicId,
        from: fromDate,
        to: toDate,
      });

    const doc = this.documents.buildFinanceMonthly({
      clinic,
      appointments,
      periodLabel: periodLabel(from, to),
    });

    return this.exporterFactory.export(doc, format);
  }

  async exportPatientsDirectory(
    query: DirectoryReportQueryDto,
  ): Promise<ExportedReport> {
    const clinic = await this.requireClinic(query.clinicId);
    const isActive =
      query.status === "inactive"
        ? false
        : query.status === "active" || !query.status
          ? true
          : undefined;
    const patients = await this.patientsService.findAll({
      clinicId: query.clinicId,
      search: query.search,
      isActive,
      gender: query.gender,
      bloodType: query.bloodType,
      primaryDoctorId: query.primaryDoctorId,
      departmentId: query.departmentId,
      visitFrom: query.visitFrom,
      visitTo: query.visitTo,
      dobFrom: query.dobFrom,
      dobTo: query.dobTo,
      sortBy:
        (query.sortBy as PatientSortBy | undefined) ?? PatientSortBy.FIRST_NAME,
      sortOrder: (query.sortOrder as SortOrder | undefined) ?? SortOrder.ASC,
    });
    const doc = this.documents.buildPatientsDirectory({
      clinic,
      patients,
      filtersLabel: query.search || query.status || "active",
    });
    return this.exporterFactory.export(
      doc,
      query.format ?? ReportFormatDto.pdf,
    );
  }

  async exportPractitionersDirectory(
    query: DirectoryReportQueryDto,
  ): Promise<ExportedReport> {
    const clinic = await this.requireClinic(query.clinicId);
    const practitioners = await this.practitionersService.findAll(
      query.clinicId,
      {
        clinicId: query.clinicId,
        search: query.search,
        status: query.status,
        departmentId: query.departmentId,
        employmentType: query.employmentType,
        gender: query.gender,
        language: query.language,
        specialty: query.specialty,
        roomId: query.roomId,
        nationality: query.nationality,
        license: query.license,
        experience: query.experience,
        sort: query.sort,
      },
    );
    const doc = this.documents.buildPractitionersDirectory({
      clinic,
      practitioners,
      filtersLabel: query.search || query.status || "all",
    });
    return this.exporterFactory.export(
      doc,
      query.format ?? ReportFormatDto.pdf,
    );
  }

  async exportPractitionerProfile(
    clinicId: string,
    practitionerId: string,
    format: ReportFormatDto = ReportFormatDto.pdf,
  ): Promise<ExportedReport> {
    const { clinic, practitioner } = await this.clinicAndPractitioner(
      clinicId,
      practitionerId,
    );
    const appointments = await this.appointmentsService.findAll(clinicId, {
      doctorId: practitionerId,
    });
    const doc = this.documents.buildPractitionerProfile({
      clinic,
      practitioner,
      appointments,
    });
    return this.exporterFactory.export(doc, format);
  }

  async exportPractitionerHours(
    clinicId: string,
    practitionerId: string,
    format: ReportFormatDto = ReportFormatDto.pdf,
  ): Promise<ExportedReport> {
    const { clinic, practitioner } = await this.clinicAndPractitioner(
      clinicId,
      practitionerId,
    );
    const doc = this.documents.buildPractitionerHours({
      clinic,
      practitionerName: practitioner.name,
      availabilities: practitioner.availabilities ?? [],
    });
    return this.exporterFactory.export(doc, format);
  }

  async exportPractitionerExceptions(
    clinicId: string,
    practitionerId: string,
    format: ReportFormatDto = ReportFormatDto.pdf,
  ): Promise<ExportedReport> {
    const { clinic, practitioner } = await this.clinicAndPractitioner(
      clinicId,
      practitionerId,
    );
    const doc = this.documents.buildPractitionerExceptions({
      clinic,
      practitionerName: practitioner.name,
      timeOffs: practitioner.timeOffs ?? [],
      overrides: practitioner.availabilityOverrides ?? [],
    });
    return this.exporterFactory.export(doc, format);
  }

  async exportPractitionerAppointments(params: {
    clinicId: string;
    practitionerId: string;
    format?: ReportFormatDto;
    from?: string;
    to?: string;
  }): Promise<ExportedReport> {
    const {
      clinicId,
      practitionerId,
      format = ReportFormatDto.pdf,
      from,
      to,
    } = params;
    const { clinic, practitioner } = await this.clinicAndPractitioner(
      clinicId,
      practitionerId,
    );
    const appointments = await this.loadAppointments(clinicId, {
      doctorId: practitionerId,
      from,
      to,
    });
    const doc = this.documents.buildAppointments({
      clinic,
      appointments,
      title: `Appointments - ${practitioner.name}`,
      filenameBase: `practitioner-appointments-${practitioner.name}`,
      filtersLabel: periodLabel(from, to),
      type: "practitioner_appointments",
    });
    return this.exporterFactory.export(doc, format);
  }

  async exportClinicAppointments(params: {
    clinicId: string;
    format?: ReportFormatDto;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<ExportedReport> {
    const { clinicId, format = ReportFormatDto.pdf, from, to, status } = params;
    const clinic = await this.requireClinic(clinicId);
    const appointments = await this.loadAppointments(clinicId, {
      from,
      to,
      status,
    });
    const doc = this.documents.buildAppointments({
      clinic,
      appointments,
      title: "Clinic Appointments",
      filenameBase: "clinic-appointments",
      filtersLabel: [periodLabel(from, to), status].filter(Boolean).join("-"),
      type: "clinic_appointments",
    });
    return this.exporterFactory.export(doc, format);
  }

  private async clinicAndPractitioner(
    clinicId: string,
    practitionerId: string,
  ) {
    const clinic = await this.requireClinic(clinicId);
    const practitioner = await this.practitionersService.findOne(
      practitionerId,
      clinicId,
    );
    return { clinic, practitioner };
  }

  private async loadAppointments(
    clinicId: string,
    filters: { doctorId?: string; from?: string; to?: string; status?: string },
  ) {
    const { fromDate, toDate } = dayBounds(filters.from, filters.to);
    const rows = await this.appointmentsService.findAll(clinicId, {
      doctorId: filters.doctorId,
      startDate: fromDate?.toISOString(),
      endDate: toDate?.toISOString(),
    });
    if (!filters.status) return rows;
    return rows.filter((row) => row.status === filters.status);
  }

  private async requireClinic(clinicId: string) {
    const clinic = await this.reportsRepository.findClinicLetterhead(clinicId);
    if (!clinic) {
      throw new NotFoundException("Clinic not found");
    }
    return clinic;
  }
}
