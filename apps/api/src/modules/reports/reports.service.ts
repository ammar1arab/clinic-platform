import { Injectable, NotFoundException } from "@nestjs/common";
import { AppointmentsService } from "@/modules/appointments/appointments.service";
import { PatientsService } from "@/modules/patients/patients.service";
import { PractitionersService } from "@/modules/practitioners/practitioners.service";
import { PatientSortBy, SortOrder } from "@/modules/patients/dto";
import { ReportsRepository } from "./reports.repository";
import { ReportDocumentFactory, type VisitReportRow } from "./report-document.factory";
import { ReportExporterFactory } from "./exporters/report-exporter.factory";
import { ExportedReport } from "./exporters/report-exporter";
import { DirectoryReportQueryDto, ReportFormatDto, VisitsReportQueryDto } from "./dto";
import { VisitsService } from "@/modules/visits/visits.service";
import type { AuthUser } from "@/modules/auth/types";
import type { VisitFiltersDto } from "@/modules/visits/visits.dto";

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
    private visitsService: VisitsService,
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
    const patients = await this.patientsService.findAll(query.clinicId, {
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
    from?: string,
    to?: string,
  ): Promise<ExportedReport> {
    const { clinic, practitioner } = await this.clinicAndPractitioner(
      clinicId,
      practitionerId,
    );
    const { fromDate, toDate } = dayBounds(from, to);
    const availabilities = (practitioner.availabilities ?? []).filter((slot) => {
      if (!fromDate && !toDate) return true;
      const starts = slot.effectiveFrom ? new Date(slot.effectiveFrom) : undefined;
      const ends = slot.effectiveUntil ? new Date(slot.effectiveUntil) : undefined;
      return (!toDate || !starts || starts <= toDate) && (!fromDate || !ends || ends >= fromDate);
    });
    const doc = this.documents.buildPractitionerHours({
      clinic,
      practitionerName: practitioner.name,
      availabilities,
      periodLabel: periodLabel(from, to),
    });
    return this.exporterFactory.export(doc, format);
  }

  async exportPractitionerExceptions(
    clinicId: string,
    practitionerId: string,
    format: ReportFormatDto = ReportFormatDto.pdf,
    from?: string,
    to?: string,
  ): Promise<ExportedReport> {
    const { clinic, practitioner } = await this.clinicAndPractitioner(
      clinicId,
      practitionerId,
    );
    const { fromDate, toDate } = dayBounds(from, to);
    const overlaps = (start: string, end: string) =>
      (!toDate || new Date(start) <= toDate) && (!fromDate || new Date(end) >= fromDate);
    const doc = this.documents.buildPractitionerExceptions({
      clinic,
      practitionerName: practitioner.name,
      timeOffs: (practitioner.timeOffs ?? []).filter((entry) => overlaps(entry.startDate, entry.endDate)),
      overrides: (practitioner.availabilityOverrides ?? []).filter((entry) => overlaps(entry.startAt, entry.endAt)),
      periodLabel: periodLabel(from, to),
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

  async exportVisits(
    actor: AuthUser,
    query: Omit<VisitsReportQueryDto, "clinicId">,
  ): Promise<ExportedReport> {
    const format = query.format ?? ReportFormatDto.pdf;
    const clinic = await this.requireClinic(actor.clinicId);
    const filters = {
      from: query.from,
      to: query.to,
      practitionerId: query.practitionerId,
      appointmentStatus: query.appointmentStatus,
      noteStatus: query.noteStatus,
      queue: query.queue,
      reportStatus: query.reportStatus,
      invoiceStatus: query.invoiceStatus,
      search: query.search,
    };
    const visits: VisitReportRow[] = [];
    for (let page = 1; ; page += 1) {
      const result = await this.visitsService.list(actor, {
        ...filters,
        page,
        limit: 100,
      } as VisitFiltersDto);
      visits.push(
        ...result.items.map((item) => ({
          scheduledAt: item.scheduledAt,
          patient: item.patient.name,
          practitioner: item.practitioner.name,
          mode: item.mode,
          appointmentStatus: item.appointmentStatus,
          noteStatus: item.noteStatus,
          reportStatus: item.reportStatus,
          invoiceStatus: item.invoiceStatus,
        })),
      );
      if (!result.items.length || visits.length >= result.total) break;
    }
    const filtersLabel = [
      periodLabel(query.from, query.to),
      query.reportStatus,
      query.invoiceStatus,
      query.queue,
    ]
      .filter(Boolean)
      .join("-");
    const doc = this.documents.buildVisits({ clinic, visits, filtersLabel });
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
