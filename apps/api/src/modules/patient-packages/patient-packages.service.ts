import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { computePayable } from "@/modules/appointments/payable";
import { PatientPackagesRepository } from "./patient-packages.repository";
import { EnrollPatientPackageDto } from "./dto";

type Enrollment = Prisma.PatientPackageGetPayload<{
  include: { package: { select: { name: true } } };
}>;

type Usage = { sessions: number; credit: Prisma.Decimal };

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class PatientPackagesService {
  constructor(
    private repo: PatientPackagesRepository,
    private prisma: PrismaService,
  ) {}

  /** Snapshot the catalog package onto the enrollment, unless the caller overrode it. */
  async enroll(clinicId: string, dto: EnrollPatientPackageDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId },
    });
    if (!patient) throw new BadRequestException("Invalid patient");

    const pkg = await this.prisma.package.findFirst({
      where: { id: dto.packageId, clinicId },
    });
    if (!pkg) throw new BadRequestException("Invalid package");

    const sessionsTotal =
      dto.sessionsTotal !== undefined ? dto.sessionsTotal : pkg.sessionCount;
    // A package without a session count is a prepaid credit pot; its price is the balance.
    const creditTotal =
      dto.creditTotal !== undefined
        ? dto.creditTotal
        : sessionsTotal == null && pkg.price != null
          ? Number(pkg.price)
          : null;

    if (sessionsTotal == null && creditTotal == null) {
      throw new BadRequestException(
        "Package must define a session count or a credit amount",
      );
    }
    if (sessionsTotal != null && creditTotal != null) {
      throw new BadRequestException(
        "Package must be session-based or credit-based, not both",
      );
    }

    const created = await this.repo.create({
      clinicId,
      patientId: dto.patientId,
      packageId: dto.packageId,
      sessionsTotal,
      creditTotal,
      notes: dto.notes,
    });
    return this.toDto(created, { sessions: 0, credit: ZERO });
  }

  /**
   * Give the patient an enrollment for this package unless they already hold one with
   * balance left. Called when a package is assigned on the patient record, so assigning
   * a package is what actually grants the balance.
   */
  async ensureEnrollment(clinicId: string, patientId: string, packageId: string) {
    const existing = await this.findWithBalance(clinicId, patientId);
    if (existing.some((e) => e.packageId === packageId && e.hasBalance)) return;
    await this.enroll(clinicId, { patientId, packageId });
  }

  async getSummary(
    clinicId: string,
    patientId: string,
    excludeAppointmentId?: string,
  ) {
    const [packages, unpaidVisits] = await Promise.all([
      this.findWithBalance(clinicId, patientId),
      this.repo.findUnpaidVisits(clinicId, patientId, excludeAppointmentId),
    ]);

    const outstanding = unpaidVisits.reduce(
      (sum, v) =>
        sum +
        computePayable(
          v.fee ? Number(v.fee) : 0,
          v.discount ? Number(v.discount) : 0,
          v.discountType,
        ),
      0,
    );

    return {
      outstanding: outstanding.toFixed(3),
      unpaidVisits: unpaidVisits.length,
      packages,
    };
  }

  async findWithBalance(clinicId: string, patientId: string, activeOnly = true) {
    const enrollments = await this.repo.findByPatient(
      clinicId,
      patientId,
      activeOnly,
    );
    const usage = await this.usageFor(enrollments);
    return enrollments.map((e) => this.toDto(e, usage.get(e.id)));
  }

  async deactivate(clinicId: string, id: string) {
    const existing = await this.repo.findById(clinicId, id);
    if (!existing) throw new NotFoundException("Patient package not found");
    const updated = await this.repo.setActive(id, false);
    const usage = await this.usageFor([updated]);
    return this.toDto(updated, usage.get(updated.id));
  }

  /**
   * Validate that this enrollment can cover the visit and report what redeeming costs.
   * Returns the credit to draw, or null when the redemption consumes a session instead.
   */
  async resolveRedemption(
    clinicId: string,
    patientId: string,
    patientPackageId: string,
    payable: number,
  ): Promise<{ enrollment: Enrollment; credit: number | null }> {
    const enrollment = await this.repo.findById(clinicId, patientPackageId);
    if (!enrollment) throw new NotFoundException("Patient package not found");
    if (enrollment.patientId !== patientId) {
      throw new BadRequestException(
        "Package does not belong to this patient",
      );
    }
    if (!enrollment.isActive) {
      throw new BadRequestException("Package is no longer active");
    }

    const usage = await this.usageFor([enrollment]);
    const dto = this.toDto(enrollment, usage.get(enrollment.id));

    if (enrollment.sessionsTotal != null) {
      if ((dto.sessionsRemaining ?? 0) <= 0) {
        throw new BadRequestException("No sessions left in this package");
      }
      return { enrollment, credit: null };
    }

    const remaining = Number(dto.creditRemaining ?? 0);
    if (remaining <= 0) {
      throw new BadRequestException("No credit left in this package");
    }
    if (remaining + 1e-9 < payable) {
      throw new BadRequestException(
        `Insufficient package credit (${remaining.toFixed(3)} left, visit costs ${payable.toFixed(3)})`,
      );
    }
    return { enrollment, credit: payable };
  }

  private async usageFor(enrollments: Enrollment[]) {
    const rows = await this.repo.aggregateUsage(enrollments.map((e) => e.id));
    return new Map<string, Usage>(
      rows.map((r) => [
        r.patientPackageId as string,
        { sessions: r._count._all, credit: r._sum.packageCredit ?? ZERO },
      ]),
    );
  }

  private toDto(enrollment: Enrollment, usage: Usage | undefined) {
    const used = usage ?? { sessions: 0, credit: ZERO };
    const isSessionBased = enrollment.sessionsTotal != null;

    const sessionsUsed = isSessionBased ? used.sessions : 0;
    const sessionsRemaining = isSessionBased
      ? Math.max(enrollment.sessionsTotal! - sessionsUsed, 0)
      : null;

    const creditTotal = enrollment.creditTotal;
    const creditUsed = isSessionBased ? ZERO : used.credit;
    const creditRemaining = creditTotal
      ? Prisma.Decimal.max(creditTotal.minus(creditUsed), ZERO)
      : null;

    return {
      id: enrollment.id,
      clinicId: enrollment.clinicId,
      patientId: enrollment.patientId,
      packageId: enrollment.packageId,
      packageName: enrollment.package.name,
      sessionsTotal: enrollment.sessionsTotal,
      sessionsUsed,
      sessionsRemaining,
      creditTotal: creditTotal ? creditTotal.toFixed(3) : null,
      creditUsed: creditUsed.toFixed(3),
      creditRemaining: creditRemaining ? creditRemaining.toFixed(3) : null,
      hasBalance: isSessionBased
        ? (sessionsRemaining ?? 0) > 0
        : (creditRemaining?.greaterThan(ZERO) ?? false),
      notes: enrollment.notes,
      isActive: enrollment.isActive,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }
}
