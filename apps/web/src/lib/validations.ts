import { getTranslations, getLanguage } from '@/i18n';
import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

const validationLocales = { en: z.locales.en(), ar: z.locales.ar() };
z.config({
  customError: (issue) => validationLocales[getLanguage()].localeError(issue),
});

export const personName = (max = 50) =>
  z
    .string()
    .trim()
    .min(1, { error: () => getTranslations().validation.required })
    .max(max, {
      error: () =>
        getTranslations().validation.maxCharacters.replace(
          '{max}',
          String(max),
        ),
    })
    .transform((val) => val.replace(/\s+/g, ' '))
    .refine((val) => /^[\p{L}\s'-]+$/u.test(val), {
      error: () => getTranslations().validation.lettersOnly,
    });

export const requiredText = (max = 60) =>
  z
    .string()
    .trim()
    .min(1, { error: () => getTranslations().validation.required })
    .max(max, {
      error: () =>
        getTranslations().validation.maxCharacters.replace(
          '{max}',
          String(max),
        ),
    });

export const optionalText = (max = 60) =>
  z
    .string()
    .trim()
    .max(max, {
      error: () =>
        getTranslations().validation.maxCharacters.replace(
          '{max}',
          String(max),
        ),
    })
    .optional()
    .or(z.literal(''));

export const internationalPhone = z
  .string()
  .optional()
  .refine((val) => !val || isValidPhoneNumber(val), {
    error: () => getTranslations().validation.phone,
  });

export const optionalEmail = z
  .string()
  .trim()
  .email({ error: () => getTranslations().validation.email })
  .optional()
  .or(z.literal(''));

export const optionalPastDate = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || new Date(val) <= new Date(), {
    error: () => getTranslations().validation.pastDate,
  });

export const positiveNumber = (max = 100000) =>
  z.coerce
    .number({ error: () => getTranslations().validation.number })
    .min(0, {
      error: () => getTranslations().validation.minNumber.replace('{min}', '0'),
    })
    .max(max, {
      error: () =>
        getTranslations().validation.maxNumber.replace('{max}', String(max)),
    });

export const patientSchema = z.object({
  firstNameEn: personName(50),
  lastNameEn: personName(50),
  firstNameAr: optionalText(50),
  lastNameAr: optionalText(50),
  nationalId: optionalText(20),
  phone: internationalPhone,
  email: optionalEmail,
  dob: optionalPastDate,
  gender: optionalText(20),
  bloodType: optionalText(5),
  allergies: optionalText(500),
  emergencyContactName: optionalText(80),
  emergencyContactPhone: internationalPhone,
  address: optionalText(200),
  imageUrl: optionalText(500),
  packageId: z.string().optional().or(z.literal('')),
  discountCodeId: z.string().optional().or(z.literal('')),
});

export const departmentSchema = z.object({
  name: requiredText(60),
  nameAr: optionalText(60),
});

export const roomSchema = z.object({
  name: requiredText(60),
  nameAr: optionalText(60),
  departmentId: z.string().optional(),
});

export const serviceSchema = z.object({
  name: requiredText(60),
  nameAr: optionalText(60),
  departmentId: z.string().optional(),
  durationMins: positiveNumber(480),
  fee: positiveNumber(10000),
});

export const appointmentSchema = z
  .object({
    patientId: z
      .string()
      .min(1, { error: () => getTranslations().validation.patient }),
    doctorId: z
      .string()
      .min(1, { error: () => getTranslations().validation.doctor }),
    departmentId: z.string(),
    roomId: z.string(),
    serviceId: z.string(),
    date: z.string().min(1, { error: () => getTranslations().validation.date }),
    time: z.string().min(1, { error: () => getTranslations().validation.time }),
    durationMins: z
      .string()
      .min(1, { error: () => getTranslations().validation.required }),
    sessionType: z.enum(['in_person', 'online']),
    meetingUrl: z.string(),
    feeOverride: z.string(),
    discount: z.string(),
    discountType: z.enum(['fixed', 'percentage']),
    discountReason: z.string(),
    notes: z
      .string()
      .max(1000, {
        error: () =>
          getTranslations().validation.maxCharacters.replace('{max}', '1000'),
      }),
  })
  .superRefine((v, ctx) => {
    const duration = Number(v.durationMins);
    if (!Number.isFinite(duration) || duration < 5) {
      ctx.addIssue({
        path: ['durationMins'],
        code: 'custom',
        message: getTranslations().validation.minDuration,
      });
    } else if (duration > 600) {
      ctx.addIssue({
        path: ['durationMins'],
        code: 'custom',
        message: getTranslations().validation.maxDuration,
      });
    }

    if (v.sessionType === 'in_person') {
      if (!v.roomId) {
        ctx.addIssue({
          path: ['roomId'],
          code: 'custom',
          message: getTranslations().validation.room,
        });
      }
    }

    if (v.sessionType === 'online') {
      const url = v.meetingUrl.trim();
      if (!url) {
        ctx.addIssue({
          path: ['meetingUrl'],
          code: 'custom',
          message: getTranslations().validation.meeting,
        });
      } else if (!/^https:\/\//i.test(url)) {
        ctx.addIssue({
          path: ['meetingUrl'],
          code: 'custom',
          message: getTranslations().validation.https,
        });
      }
    }

    if (v.feeOverride.trim()) {
      const fee = Number(v.feeOverride);
      if (!Number.isFinite(fee) || fee < 0) {
        ctx.addIssue({
          path: ['feeOverride'],
          code: 'custom',
          message: getTranslations().validation.amount,
        });
      }
    }

    if (v.discount.trim()) {
      const d = Number(v.discount);
      if (!Number.isFinite(d) || d < 0) {
        ctx.addIssue({
          path: ['discount'],
          code: 'custom',
          message: getTranslations().validation.amount,
        });
      } else if (v.discountType === 'percentage' && d > 100) {
        ctx.addIssue({
          path: ['discount'],
          code: 'custom',
          message: getTranslations().validation.maxPercent,
        });
      } else if (d > 0 && !v.discountReason.trim()) {
        ctx.addIssue({
          path: ['discountReason'],
          code: 'custom',
          message: getTranslations().validation.discountReason,
        });
      }
    }
  });

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .min(1, { error: () => getTranslations().validation.required }),
  endTime: z
    .string()
    .min(1, { error: () => getTranslations().validation.required }),
});

const timeOffSchema = z.object({
  startDate: z
    .string()
    .min(1, { error: () => getTranslations().validation.required }),
  endDate: z
    .string()
    .min(1, { error: () => getTranslations().validation.required }),
  reason: z.string().optional().or(z.literal('')),
});

export const practitionerSchema = z
  .object({
    name: requiredText(80),
    nameAr: optionalText(80),
    title: optionalText(40),
    email: z
      .string()
      .trim()
      .email({ error: () => getTranslations().validation.email })
      .optional()
      .or(z.literal('')),
    phone: internationalPhone,
    whatsapp: internationalPhone,
    nationality: optionalText(2),
    specialty: optionalText(80),
    specialtyAr: optionalText(80),
    languages: z.array(z.string()),
    dob: optionalPastDate,
    gender: optionalText(20),
    bio: optionalText(2000),
    bioAr: optionalText(2000),
    experienceYears: z.string().optional().or(z.literal('')),
    imageUrl: optionalText(500),
    licenseNumber: optionalText(80),
    licenseExpiry: z.string().optional().or(z.literal('')),
    departmentId: z
      .string()
      .min(1, { error: () => getTranslations().validation.department }),
    defaultRoomId: z.string().optional().or(z.literal('')),
    employmentType: z.enum(['salaried', 'commission', 'mixed', '']).optional(),
    commissionPercent: z.string().optional().or(z.literal('')),
    bufferMins: z
      .string()
      .min(1, { error: () => getTranslations().validation.required }),
    serviceIds: z.array(z.string()),
    availabilities: z.array(availabilitySlotSchema),
    timeOffs: z.array(timeOffSchema),
  })
  .superRefine((v, ctx) => {
    if (v.experienceYears?.trim()) {
      const years = Number(v.experienceYears);
      if (!Number.isFinite(years) || years < 0 || years > 80) {
        ctx.addIssue({
          path: ['experienceYears'],
          code: 'custom',
          message: getTranslations().validation.years,
        });
      }
    }

    const buffer = Number(v.bufferMins);
    if (!Number.isFinite(buffer) || buffer < 0 || buffer > 240) {
      ctx.addIssue({
        path: ['bufferMins'],
        code: 'custom',
        message: getTranslations().validation.buffer,
      });
    }

    if (v.employmentType === 'commission' || v.employmentType === 'mixed') {
      const pct = Number(v.commissionPercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        ctx.addIssue({
          path: ['commissionPercent'],
          code: 'custom',
          message: getTranslations().validation.commission,
        });
      }
    }

    v.availabilities.forEach((slot, index) => {
      if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
        ctx.addIssue({
          path: ['availabilities', index, 'endTime'],
          code: 'custom',
          message: getTranslations().validation.endAfter,
        });
      }
    });

    v.timeOffs.forEach((entry, index) => {
      if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
        ctx.addIssue({
          path: ['timeOffs', index, 'endDate'],
          code: 'custom',
          message: getTranslations().validation.endOnAfter,
        });
      }
    });
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: () => getTranslations().validation.required })
    .email({ error: () => getTranslations().validation.email }),
  password: z.string().min(6, {
    error: () => getTranslations().validation.passwordMin,
  }),
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type PractitionerFormData = z.infer<typeof practitionerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
