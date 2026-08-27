'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Textarea,
} from '@/components/ui';
import {
  FormField,
  FormActions,
  PhoneInputField,
  DatePicker,
  AvatarUpload,
} from '@/components/primitives';
import { FORM_NONE } from '@/constants/form';
import { GENDERS, BLOOD_TYPES } from '@/constants/patient';
import { patientSchema, PatientFormData } from '@/lib/validations';
import { useCreatePatient, useUpdatePatient } from '@/hooks/api/use-patients';
import { usePackages } from '@/hooks/api/use-packages';
import { useDiscountCodes } from '@/hooks/api/use-discount-codes';
import type { PatientDetail, CreatePatientInput } from '@/services/patients.service';
import { pickRandomAvatarUrl, persistableImageUrl, resolveAvatarUrl } from '@/lib/avatars';

interface Props {
  clinicId: string;
  patient?: PatientDetail;
  onCancel: () => void;
  onSuccess: (id: string) => void;
}

function emptyPatientValues(): PatientFormData {
  return {
    firstNameEn: '',
    lastNameEn: '',
    firstNameAr: '',
    lastNameAr: '',
    nationalId: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    bloodType: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    imageUrl: pickRandomAvatarUrl(),
    packageId: '',
    discountCodeId: '',
  };
}

function toFormValues(patient: PatientDetail): PatientFormData {
  return {
    firstNameEn: patient.firstNameEn,
    lastNameEn: patient.lastNameEn,
    firstNameAr: patient.firstNameAr ?? '',
    lastNameAr: patient.lastNameAr ?? '',
    nationalId: patient.nationalId ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    dob: patient.dob ? patient.dob.slice(0, 10) : '',
    gender: patient.gender ?? '',
    bloodType: patient.bloodType ?? '',
    allergies: patient.allergies ?? '',
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
    address: patient.address ?? '',
    imageUrl: resolveAvatarUrl(patient.imageUrl, patient.id),
    packageId: patient.packageId ?? '',
    discountCodeId: patient.discountCodeId ?? '',
  };
}


function toPayload(data: PatientFormData): Omit<CreatePatientInput, 'clinicId'> {
  const clean = (v?: string) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
  };
  return {
    firstNameEn: data.firstNameEn.trim(),
    lastNameEn: data.lastNameEn.trim(),
    firstNameAr: clean(data.firstNameAr),
    lastNameAr: clean(data.lastNameAr),
    nationalId: clean(data.nationalId),
    phone: clean(data.phone),
    email: clean(data.email),
    dob: clean(data.dob),
    gender: clean(data.gender),
    bloodType: clean(data.bloodType),
    allergies: clean(data.allergies),
    emergencyContactName: clean(data.emergencyContactName),
    emergencyContactPhone: clean(data.emergencyContactPhone),
    address: clean(data.address),
    imageUrl: persistableImageUrl(data.imageUrl),
    packageId: data.packageId?.trim() ? data.packageId.trim() : null,
    discountCodeId: data.discountCodeId?.trim() ? data.discountCodeId.trim() : null,
  };
}

export function PatientForm({ clinicId, patient, onCancel, onSuccess }: Props) {
  const isEdit = !!patient;
  const createMutation = useCreatePatient(clinicId);
  const updateMutation = useUpdatePatient(clinicId);
  const { data: packages } = usePackages(clinicId);
  const { data: discountCodes } = useDiscountCodes(clinicId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const activePackages = (packages ?? []).filter((p) => p.isActive);
  const activeCodes = (discountCodes ?? []).filter((c) => c.isActive);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? toFormValues(patient) : emptyPatientValues(),
  });

  const onSubmit = (data: PatientFormData) => {
    const payload = toPayload(data);
    if (isEdit && patient) {
      updateMutation.mutate(
        { id: patient.id, data: payload },
        { onSuccess: (res) => onSuccess(res.id) },
      );
    } else {
      createMutation.mutate(
        { clinicId, ...payload },
        { onSuccess: (res) => onSuccess(res.id) },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField error={errors.imageUrl?.message} className="sm:col-span-2">
            <AvatarUpload
              value={watch('imageUrl')}
              onChange={(url) =>
                setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true })
              }
              fallbackLabel={`${watch('firstNameEn') || 'P'}${watch('lastNameEn') || ''}`}
              disabled={isPending}
              alt="Patient photo"
            />
          </FormField>
          <FormField label="First Name (English)" required error={errors.firstNameEn?.message}>
            <Input maxLength={50} {...register('firstNameEn')} placeholder="First name" />
          </FormField>
          <FormField label="Last Name (English)" required error={errors.lastNameEn?.message}>
            <Input maxLength={50} {...register('lastNameEn')} placeholder="Last name" />
          </FormField>
          <FormField label="First Name (Arabic)" error={errors.firstNameAr?.message}>
            <Input
              maxLength={50}
              dir="rtl"
              lang="ar"
              className="text-right"
              placeholder="الاسم الأول"
              {...register('firstNameAr')}
            />
          </FormField>
          <FormField label="Last Name (Arabic)" error={errors.lastNameAr?.message}>
            <Input
              maxLength={50}
              dir="rtl"
              lang="ar"
              className="text-right"
              placeholder="اسم العائلة"
              {...register('lastNameAr')}
            />
          </FormField>
          <FormField label="Date of Birth" error={errors.dob?.message}>
            <Controller
              control={control}
              name="dob"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date"
                  withDropdown
                  toDate={new Date()}
                />
              )}
            />
          </FormField>
          <FormField label="Gender" error={errors.gender?.message}>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  value={field.value || FORM_NONE}
                  onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>Not specified</SelectItem>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Phone" error={errors.phone?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInputField value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </FormField>
          <FormField
            label="Emergency Contact Name"
            error={errors.emergencyContactName?.message}
          >
            <Input maxLength={80} {...register('emergencyContactName')} />
          </FormField>
          <FormField
            label="Emergency Contact Phone"
            error={errors.emergencyContactPhone?.message}
          >
            <Controller
              control={control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <PhoneInputField value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" maxLength={120} {...register('email')} />
          </FormField>
          <FormField label="National ID" error={errors.nationalId?.message}>
            <Input maxLength={20} {...register('nationalId')} />
          </FormField>
          <FormField label="Address" error={errors.address?.message} className="sm:col-span-2">
            <Textarea rows={2} maxLength={200} placeholder="Home address" {...register('address')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Medical</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Blood Type" error={errors.bloodType?.message}>
            <Controller
              control={control}
              name="bloodType"
              render={({ field }) => (
                <Select
                  value={field.value || FORM_NONE}
                  onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>Not specified</SelectItem>
                    {BLOOD_TYPES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Allergies" error={errors.allergies?.message} className="sm:col-span-2">
            <Textarea
              rows={2}
              maxLength={500}
              placeholder="Known allergies, if any"
              {...register('allergies')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Billing defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Package"
              error={errors.packageId?.message}
              className="sm:col-span-2"
              hint="Applied automatically when booking an appointment for this patient."
            >
              <Controller
                control={control}
                name="packageId"
                render={({ field }) => (
                  <Select
                    value={field.value || FORM_NONE}
                    onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None — optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FORM_NONE}>None</SelectItem>
                      {activePackages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name}
                          {pkg.price != null ? ` · ${Number(pkg.price).toFixed(3)}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          <FormField
            label="Promocode"
            error={errors.discountCodeId?.message}
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="discountCodeId"
              render={({ field }) => (
                <Select
                  value={field.value || FORM_NONE}
                  onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None — optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>None</SelectItem>
                    {activeCodes.map((code) => (
                      <SelectItem key={code.id} value={code.id}>
                        {code.code} ·{' '}
                        {code.discountType === 'percentage'
                          ? `${Number(code.discountValue)}%`
                          : Number(code.discountValue).toFixed(3)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </CardContent>
      </Card>

      <FormActions
        onCancel={onCancel}
        pending={isPending}
        submitLabel={isEdit ? 'Save Changes' : 'Create Patient'}
      />
    </form>
  );
}
