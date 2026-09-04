'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { FormField } from '@/components/primitives';
import { formatClinicAmount } from '@/lib/package-balance';
import type { AppointmentFormData } from '@/lib/validations';
import type { ClinicStaffMember } from '@/services/clinics.service';
import type { Department } from '@/services/departments.service';
import type { Patient } from '@/services/patients.service';
import type { ServiceItem } from '@/services/services.service';
import { PatientCombobox } from './patient-combobox';
import { DoctorCombobox } from '../shared/doctor-combobox';
import { FormSection, OptionalSelect } from './appointment-form-controls';
import { formatDoctorLabel } from '../shared/appointment-display';
import { useLanguage } from '@/providers';

export function AppointmentVisitFields({
  patients,
  staff,
  departments,
  services,
  currentDoctorName,
  onPatientChange,
  onServiceChange,
}: {
  patients: Patient[] | undefined;
  staff: ClinicStaffMember[] | undefined;
  departments: Department[] | undefined;
  services: ServiceItem[] | undefined;
  currentDoctorName: string;
  onPatientChange: (id: string) => void;
  onServiceChange: (serviceId: string) => void;
}) {
  const { t, lang } = useLanguage();
  const {
    control,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();

  return (
    <FormSection
      title={t.appointments.appointmentDetails}
      contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
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
              onChange={field.onChange}
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

      <FormField
        label={t.practitioner.department}
        error={errors.departmentId?.message}
      >
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <OptionalSelect
              value={field.value}
              onChange={field.onChange}
              searchPlaceholder={t.appointments.searchDepartments}
              options={(departments ?? []).map((dept) => ({
                value: dept.id,
                label: (lang === 'ar' && dept.nameAr) || dept.name,
              }))}
            />
          )}
        />
      </FormField>

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
              options={(services ?? []).map((service) => {
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
    </FormSection>
  );
}
