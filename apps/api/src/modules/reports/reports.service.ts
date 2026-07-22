import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportDocumentFactory } from './report-document.factory';
import { ReportExporterFactory } from './exporters/report-exporter.factory';
import { ExportedReport } from './exporters/report-exporter';
import { ReportFormat } from './types/report-document';
import { ReportFormatDto } from './dto';

@Injectable()
export class ReportsService {
  private readonly documents = new ReportDocumentFactory();

  constructor(
    private reportsRepository: ReportsRepository,
    private exporterFactory: ReportExporterFactory,
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
      throw new NotFoundException('Patient not found');
    }

    const doc = this.documents.buildPatientMedical({
      clinic,
      patient,
      appointments: patient.appointments,
    });

    return this.exporterFactory.export(doc, format as ReportFormat);
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

    const fromDate = from
      ? new Date(`${from.includes('T') ? from.split('T')[0] : from}T00:00:00.000Z`)
      : undefined;
    const toDate = to
      ? new Date(`${to.includes('T') ? to.split('T')[0] : to}T23:59:59.999Z`)
      : undefined;

    const referrals = await this.reportsRepository.findReferralsForReport({
      clinicId,
      patientId,
      toDoctorId,
      from: fromDate,
      to: toDate,
    });

    const filterBits = [
      patientId ? 'patient' : '',
      toDoctorId ? 'inbox' : '',
      from || to ? `${from ?? '…'}_${to ?? '…'}` : '',
    ].filter(Boolean);

    const doc = this.documents.buildReferrals({
      clinic,
      referrals,
      filtersLabel: filterBits.join('-') || 'all',
    });

    return this.exporterFactory.export(doc, format as ReportFormat);
  }

  async exportFinance(params: {
    clinicId: string;
    format?: ReportFormatDto;
    from?: string;
    to?: string;
  }): Promise<ExportedReport> {
    const {
      clinicId,
      format = ReportFormatDto.pdf,
      from,
      to,
    } = params;

    const clinic = await this.requireClinic(clinicId);

    const fromDate = from
      ? new Date(`${from.includes('T') ? from.split('T')[0] : from}T00:00:00.000Z`)
      : undefined;
    const toDate = to
      ? new Date(`${to.includes('T') ? to.split('T')[0] : to}T23:59:59.999Z`)
      : undefined;

    const appointments =
      await this.reportsRepository.findAppointmentsForFinanceReport({
        clinicId,
        from: fromDate,
        to: toDate,
      });

    const periodLabel =
      from || to ? `${from ?? '…'}_${to ?? '…'}` : 'all';

    const doc = this.documents.buildFinanceMonthly({
      clinic,
      appointments,
      periodLabel,
    });

    return this.exporterFactory.export(doc, format as ReportFormat);
  }

  private async requireClinic(clinicId: string) {
    const clinic = await this.reportsRepository.findClinicLetterhead(clinicId);
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }
}
