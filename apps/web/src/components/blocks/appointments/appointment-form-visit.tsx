'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { FormField } from '@/components/primitives';
import { formatClinicAmount } from '@/lib/package-balance';
import type { AppointmentFormData } from '@/lib/validations';
import type { ClinicStaffMember } from '@/services/clinics.service';
import type { Department } from '@/services/departments.service';
import type { Patient } from '@/services/patients.service';
import type { ServiceItem } from '@/services/services.service';
import { PatientCombobox } from './patient-combobox';
import { FormSection, OptionalSelect } from './appointment-form-controls';
import { staffRoleLabel } from './appointment-form.mapper';

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
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {staff?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                    {staffRoleLabel(member.role)}
                  </SelectItem>
                ))}
                {field.value && !staff?.some((member) => member.id === field.value) && currentDoctorName && (
                  <SelectItem value={field.value}>{currentDoctorName}</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Department" error={errors.departmentId?.message}>
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <OptionalSelect value={field.value} onChange={field.onChange}>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </OptionalSelect>
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
            >
              {services?.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} · {formatClinicAmount(service.fee)}
                </SelectItem>
              ))}
            </OptionalSelect>
          )}
        />
      </FormField>
    </FormSection>
  );
}
