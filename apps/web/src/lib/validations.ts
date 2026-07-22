import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

// ==================== Reusable Primitives ====================
// Compose these into feature schemas instead of writing fresh rules each time.

export const personName = (max = 50) =>
  z
    .string()
    .trim()
    .min(1, 'Required')
    .max(max, `Max ${max} characters`)
    .transform((val) => val.replace(/\s+/g, ' '))
    .refine((val) => /^[\p{L}\s'-]+$/u.test(val), 'Letters only');

export const requiredText = (max = 60) =>
  z.string().trim().min(1, 'Required').max(max, `Max ${max} characters`);

export const optionalText = (max = 60) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .optional()
    .or(z.literal(''));

export const internationalPhone = z
  .string()
  .optional()
  .refine((val) => !val || isValidPhoneNumber(val), 'Enter a valid phone number');

export const optionalEmail = z
  .string()
  .trim()
  .email('Enter a valid email')
  .optional()
  .or(z.literal(''));

/** Optional ISO date (yyyy-mm-dd) that must not be in the future. */
export const optionalPastDate = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || new Date(val) <= new Date(), 'Date cannot be in the future');

export const positiveNumber = (max = 100000) => z.coerce.number().min(0).max(max);

// ==================== Feature Schemas ====================

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
    patientId: z.string().min(1, 'Select a patient'),
    doctorId: z.string().min(1, 'Select a doctor'),
    departmentId: z.string(),
    roomId: z.string(),
    serviceId: z.string(),
    date: z.string().min(1, 'Pick a date'),
    time: z.string().min(1, 'Pick a time'),
    durationMins: z.string().min(1, 'Required'),
    sessionType: z.enum(['in_person', 'online']),
    meetingUrl: z.string(),
    feeOverride: z.string(),
    discount: z.string(),
    discountType: z.enum(['fixed', 'percentage']),
    discountReason: z.string(),
    notes: z.string().max(1000, 'Max 1000 characters'),
  })
  .superRefine((v, ctx) => {
    const duration = Number(v.durationMins);
    if (!Number.isFinite(duration) || duration < 5) {
      ctx.addIssue({ path: ['durationMins'], code: 'custom', message: 'Min 5 minutes' });
    } else if (duration > 600) {
      ctx.addIssue({ path: ['durationMins'], code: 'custom', message: 'Max 600 minutes' });
    }

    if (v.sessionType === 'in_person') {
      if (!v.roomId) {
        ctx.addIssue({
          path: ['roomId'],
          code: 'custom',
          message: 'Room is required for in-person visits',
        });
      }
    }

    if (v.sessionType === 'online') {
      const url = v.meetingUrl.trim();
      if (!url) {
        ctx.addIssue({
          path: ['meetingUrl'],
          code: 'custom',
          message: 'Meeting link is required for online visits',
        });
      } else if (!/^https:\/\//i.test(url)) {
        ctx.addIssue({
          path: ['meetingUrl'],
          code: 'custom',
          message: 'Link must start with https://',
        });
      }
    }

    if (v.feeOverride.trim()) {
      const fee = Number(v.feeOverride);
      if (!Number.isFinite(fee) || fee < 0) {
        ctx.addIssue({ path: ['feeOverride'], code: 'custom', message: 'Enter a valid amount' });
      }
    }

    if (v.discount.trim()) {
      const d = Number(v.discount);
      if (!Number.isFinite(d) || d < 0) {
        ctx.addIssue({ path: ['discount'], code: 'custom', message: 'Enter a valid amount' });
      } else if (v.discountType === 'percentage' && d > 100) {
        ctx.addIssue({ path: ['discount'], code: 'custom', message: 'Max 100%' });
      } else if (d > 0 && !v.discountReason.trim()) {
        ctx.addIssue({
          path: ['discountReason'],
          code: 'custom',
          message: 'Reason is required when a discount is applied',
        });
      }
    }
  });

// ==================== Inferred Types ====================

export type PatientFormData = z.infer<typeof patientSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;