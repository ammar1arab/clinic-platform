'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FormField, ReadOnlyMark } from '@/components/primitives';
import { formatClinicAmount } from '@/lib/package-balance';
import type { AppointmentFormData } from '@/lib/validations';
import type { ClinicStaffMember } from '@/services/clinics.service';
import type { Department } from '@/services/departments.service';
import type { Patient } from '@/services/patients.service';
import type { ServiceItem } from '@/services/services.service';
import { PatientCombobox } from './patient-combobox';
import { DoctorCombobox } from '../shared/doctor-combobox';
import { FormSection, LockedValue, OptionalSelect } from './appointment-form-controls';
import { formatDoctorLabel } from '../shared/appointment-display';
import { useLanguage } from '@/providers';
import type { AppointmentFieldAccess, AppointmentReadOnly } from './appointment-form-sections';

export function AppointmentVisitFields({
  patients,
  staff,
  departments,
  services,
  currentDoctorName,
  access,
  readOnly,
  onPatientChange,
  onServiceChange,
}: {
  patients: Patient[] | undefined;
  staff: ClinicStaffMember[] | undefined;
  departments: Department[] | undefined;
  services: ServiceItem[] | undefined;
  currentDoctorName: string;
  access: Pick<AppointmentFieldAccess, 'patient' | 'doctor' | 'department' | 'service'>;
  readOnly?: Pick<AppointmentReadOnly, 'patient' | 'doctor' | 'department' | 'service'>;
  onPatientChange: (id: string) => void;
  onServiceChange: (serviceId: string) => void;
}) {
  const { t, lang } = useLanguage();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();
  const doctorId = useWatch({ control, name: 'doctorId' });
  const serviceId = useWatch({ control, name: 'serviceId' });
  const selectedDoctor = staff?.find((member) => member.id === doctorId);
  const doctorDepartment = departments?.find((dept) => dept.id === selectedDoctor?.departmentId);
  const doctorServiceIds = selectedDoctor?.serviceIds ?? [];
  const doctorServices = (services ?? []).filter((service) => doctorServiceIds.includes(service.id) || service.id === serviceId);
  const editable = [access.patient, access.doctor, access.department, access.service];
  const sectionLocked = editable.every((allowed) => !allowed);
  const partial = !sectionLocked && editable.some((allowed) => !allowed);

  return (
    <FormSection
      title={t.appointments.appointmentDetails}
      action={sectionLocked ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}
      contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end"
    >
      {access.patient ? (
      <FormField
        label={t.appointments.patient}
        required
        error={errors.patientId?.message}
        className="sm:col-span-2"
      >
        <Controller
          control={control}
          name="patientId"
          render={({ field }) => (
            <PatientCombobox
              patients={patients}
              value={field.value}
              onChange={(id) => {
                field.onChange(id);
                if (id) onPatientChange(id);
              }}
            />
          )}
        />
      </FormField>
      ) : (
        <LockedValue
          label={t.appointments.patient}
          value={readOnly?.patient ?? ''}
          marked={partial}
          className="sm:col-span-2"
        />
      )}

      {access.doctor ? (
      <FormField
        label={t.practitioner.practitioner}
        required
        error={errors.doctorId?.message}
      >
        <Controller
          control={control}
          name="doctorId"
          render={({ field }) => (
            <DoctorCombobox
              doctors={staff}
              value={field.value}
              onChange={(id) => {
                field.onChange(id);
                const member = staff?.find((item) => item.id === id);
                setValue('departmentId', member?.departmentId ?? '');
                if (!(member?.serviceIds ?? []).includes(serviceId)) setValue('serviceId', '');
              }}
              extraOption={
                field.value && !staff?.some((member) => member.id === field.value) && currentDoctorName
                  ? { value: field.value, label: formatDoctorLabel(currentDoctorName, { lang }) }
                  : undefined
              }
              className="w-full"
            />
          )}
        />
      </FormField>
      ) : (
        <LockedValue
          label={t.practitioner.practitioner}
          value={readOnly?.doctor ?? ''}
          marked={partial}
        />
      )}

      <LockedValue
        inline
        label={t.practitioner.department}
        value={doctorDepartment ? (lang === 'ar' && doctorDepartment.nameAr) || doctorDepartment.name : (readOnly?.department ?? '')}
        marked={partial}
      />

      {access.service ? (
      <FormField
        label={t.practitioner.services}
        error={errors.serviceId?.message}
        className="sm:col-span-2"
      >
        <Controller
          control={control}
          name="serviceId"
          render={({ field }) => (
            <OptionalSelect
              value={field.value}
              onChange={(id) => {
                field.onChange(id);
                if (id) onServiceChange(id);
              }}
              searchPlaceholder={t.appointments.searchServices}
              disabled={!selectedDoctor}
              options={doctorServices.map((service) => {
                const svcName = (lang === 'ar' && service.nameAr) || service.name;
                return {
                  value: service.id,
                  label: `${svcName} · ${formatClinicAmount(service.fee)}`,
                };
              })}
            />
          )}
        />
      </FormField>
      ) : (
        <LockedValue
          label={t.practitioner.services}
          value={readOnly?.service ?? ''}
          marked={partial}
          className="sm:col-span-2"
        />
      )}
    </FormSection>
  );
}
