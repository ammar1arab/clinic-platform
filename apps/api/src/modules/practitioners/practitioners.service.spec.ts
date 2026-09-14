import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { EmailService } from "@/infrastructure";
import { PractitionersService } from "./practitioners.service";
import { PractitionersRepository } from "./practitioners.repository";

const practitionerRow = {
  id: "doc-1",
  clinicId: "clinic-1",
  userId: "user-1",
  role: "practitioner",
  name: "Dr Test",
  nameAr: null,
  title: null,
  phone: null,
  whatsapp: null,
  nationality: null,
  specialty: null,
  specialtyAr: null,
  languages: [],
  initials: "DT",
  dob: null,
  gender: null,
  bio: null,
  bioAr: null,
  experienceYears: null,
  imageUrl: null,
  licenseNumber: null,
  licenseExpiry: null,
  departmentId: "dept-1",
  department: { name: "Derm", nameAr: null },
  defaultRoomId: null,
  defaultRoom: null,
  employmentType: null,
  commissionPercent: null,
  bufferMins: 0,
  isActive: true,
  services: [],
  availabilities: [],
  timeOffs: [],
  availabilityOverrides: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  user: { email: "doc@test.com" },
};

describe("PractitionersService availability rules", () => {
  let service: PractitionersService;
  let repo: { findById: jest.Mock; replaceAvailability: jest.Mock };

  beforeEach(async () => {
    repo = {
      findById: jest.fn().mockResolvedValue(practitionerRow),
      replaceAvailability: jest.fn().mockResolvedValue(practitionerRow),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PractitionersService,
        { provide: PractitionersRepository, useValue: repo },
        { provide: EmailService, useValue: { send: jest.fn() } },
      ],
    }).compile();
    service = module.get(PractitionersService);
  });

  it("rejects overlapping windows on the same weekday", async () => {
    await expect(
      service.replaceAvailability("doc-1", {
        availabilities: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 1, startTime: "12:00", endTime: "17:00" },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.replaceAvailability).not.toHaveBeenCalled();
  });

  it("allows split shifts that only touch at the boundary", async () => {
    await expect(
      service.replaceAvailability("doc-1", {
        availabilities: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 1, startTime: "12:00", endTime: "17:00" },
        ],
      }),
    ).resolves.toBeDefined();
    expect(repo.replaceAvailability).toHaveBeenCalled();
  });
});
