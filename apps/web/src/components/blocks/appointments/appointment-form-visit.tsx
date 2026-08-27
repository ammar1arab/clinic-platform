'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { FormField } from '@/components/primitives';
import { formatClinicAmount } from '@/lib/package-balance';
import type { AppointmentFormData } from '@/lib/validations';
import type { ClinicStaffMember } from '@/services/clinics.service';
import type { Department } from '@/services/departments.service';
import type { Patient } from '@/services/patients.service';
import type { ServiceItem } from '@/services/services.service';
import { PatientCombobox } from './patient-combobox';
import { DoctorCombobox } from './doctor-combobox';
import { FormSection, OptionalSelect } from './appointment-form-controls';
import { formatDoctorLabel } from './appointment-display';

export function AppointmentVisitFields({
  control,
  errors,
  patients,
  staff,
  departments,
  services,
  currentDoctorName,
  onPatientChange,
  onServiceChange,
}: {
  control: Control<AppointmentFormData>;
  errors: FieldErrors<AppointmentFormData>;
  patients: Patient[] | undefined;
  staff: ClinicStaffMember[] | undefined;
  departments: Department[] | undefined;
  services: ServiceItem[] | undefined;
  currentDoctorName: string;
  onPatientChange: (id: string) => void;
  onServiceChange: (serviceId: string) => void;
}) {
  return (
    <FormSection title="Visit Details" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        label="Patient"
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

      <FormField label="Doctor" required error={errors.doctorId?.message}>
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
                  ? { value: field.value, label: formatDoctorLabel(currentDoctorName) }
                  : undefined
              }
              className="w-full"
            />
          )}
        />
      </FormField>

      <FormField label="Department" error={errors.departmentId?.message}>
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <OptionalSelect
              value={field.value}
              onChange={field.onChange}
              searchPlaceholder="Search departments…"
              options={(departments ?? []).map((dept) => ({
                value: dept.id,
                label: dept.name,
              }))}
            />
          )}
        />
      </FormField>

      <FormField label="Service" error={errors.serviceId?.message} className="sm:col-span-2">
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
              searchPlaceholder="Search services…"
              options={(services ?? []).map((service) => ({
                value: service.id,
                label: `${service.name} · ${formatClinicAmount(service.fee)}`,
              }))}
            />
          )}
        />
      </FormField>
    </FormSection>
  );
}
