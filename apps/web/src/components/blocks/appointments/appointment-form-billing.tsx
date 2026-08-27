'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Badge, Button, Input, Switch } from '@/components/ui';
import { FormField } from '@/components/primitives';
import { ButtonSpinner } from '@/components/blocks/feedback';
import { CLINIC_CURRENCY } from '@/constants/appointment';
import { IconCreditCard, IconWarning } from '@/constants/icons';
import { formatClinicAmount, formatClinicNumber } from '@/lib/package-balance';
import type { AppointmentFormData } from '@/lib/validations';
import type { Appointment } from '@/services/appointments.service';
import type { PaymentMethod } from '@/services/payment-methods.service';
import type { ServiceItem } from '@/services/services.service';
import type { PatientBillingSummary } from '@/services/patient-packages.service';
import { PatientBalancePanel } from './patient-balance-panel';
import {
  FormSection,
  OptionalSelect,
  SegmentedToggle,
  SummaryRow,
} from './appointment-form-controls';
import { packageCreditLabel, paymentStatusMeta } from './appointment-form.mapper';

type Pricing = { fee: number; discountAmount: number; payable: number };

export function AppointmentBillingFields({
  control,
  errors,
  register,
  appointment,
  isEdit,
  hasPatient,
  selectedService,
  pricing,
  pricingLocked,
  fixedExceedsFee,
  promoCode,
  onPromoCodeChange,
  validatePending,
  onApplyCode,
  billing,
  billingLoading,
  pendingPackageId,
  onSelectPending,
  onRedeem,
  onRelease,
  redeemPending,
  releasePending,
  payMethodId,
  onPayMethodChange,
  paymentMethods,
  onTogglePaid,
  paidPending,
}: {
  control: Control<AppointmentFormData>;
  errors: FieldErrors<AppointmentFormData>;
  register: UseFormRegister<AppointmentFormData>;
  appointment?: Appointment;
  isEdit: boolean;
  hasPatient: boolean;
  selectedService: ServiceItem | undefined;
  pricing: Pricing;
  pricingLocked: boolean;
  fixedExceedsFee: boolean;
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  validatePending: boolean;
  onApplyCode: () => void;
  billing: PatientBillingSummary | undefined;
  billingLoading: boolean;
  pendingPackageId: string | null;
  onSelectPending?: (id: string | null) => void;
  onRedeem: (patientPackageId: string) => void;
  onRelease: () => void;
  redeemPending: boolean;
  releasePending: boolean;
  payMethodId: string;
  onPayMethodChange: (id: string) => void;
  paymentMethods: PaymentMethod[];
  onTogglePaid: (paid: boolean) => void;
  paidPending: boolean;
}) {
  const payment = appointment ? paymentStatusMeta(appointment) : null;

  return (
    <FormSection title="Billing" contentClassName="space-y-4">
      {pricingLocked && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-2.5 py-2">
          <IconWarning className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">
            Pricing is locked while this visit is package-covered. Remove package coverage to edit
            fee or discount.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Fee"
          error={errors.feeOverride?.message}
          hint={
            selectedService
              ? 'Leave blank to use the service fee.'
              : 'Enter a fee or pick a service.'
          }
        >
          <Input
            type="number"
            min={0}
            step="0.001"
            placeholder={selectedService ? formatClinicNumber(selectedService.fee) : '0.000'}
            disabled={pricingLocked}
            {...register('feeOverride')}
          />
        </FormField>

        <FormField
          label="Discount"
          error={
            errors.discount?.message ||
            (fixedExceedsFee ? 'Discount cannot exceed the fee.' : undefined)
          }
        >
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              step="0.001"
              placeholder="0"
              className="flex-1"
              disabled={pricingLocked}
              {...register('discount')}
            />
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <SegmentedToggle
                  value={field.value}
                  disabled={pricingLocked}
                  onChange={field.onChange}
                  options={[
                    { value: 'fixed', label: CLINIC_CURRENCY },
                    { value: 'percentage', label: '%' },
                  ]}
                />
              )}
            />
          </div>
        </FormField>
      </div>

      <FormField label="Promocode">
        <div className="flex gap-2">
          <Input
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
            placeholder="Optional promo code"
            className="font-mono"
            disabled={pricingLocked}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pricingLocked || !promoCode.trim() || validatePending}
            onClick={onApplyCode}
          >
            {validatePending ? <ButtonSpinner className="mr-0" /> : 'Apply'}
          </Button>
        </div>
      </FormField>

      <FormField label="Discount reason" error={errors.discountReason?.message}>
        <Input
          placeholder="Required when a discount is applied"
          disabled={pricingLocked}
          {...register('discountReason')}
        />
      </FormField>

      {hasPatient ? (
        <PatientBalancePanel
          billing={billing}
          isLoading={billingLoading}
          coveringPackageId={appointment?.patientPackageId}
          payable={pricing.payable}
          canRedeem={isEdit && !!appointment && !appointment.isPaid && !appointment.patientPackageId}
          pendingPackageId={isEdit ? null : pendingPackageId}
          onSelectPending={isEdit ? undefined : onSelectPending}
          onRedeem={onRedeem}
          onRelease={onRelease}
          redeemPending={redeemPending}
          releasePending={releasePending}
          disabledReason={
            appointment?.isPaid && !appointment.patientPackageId ? 'Already paid' : undefined
          }
        />
      ) : null}

      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <SummaryRow label="Base fee" value={formatClinicAmount(pricing.fee)} />
        <SummaryRow
          label="Discount"
          value={`- ${formatClinicAmount(pricing.discountAmount)}`}
          muted
        />
        <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
          <span>Payable</span>
          <span>
            {appointment?.patientPackageId ? formatClinicAmount(0) : formatClinicAmount(pricing.payable)}
          </span>
        </div>
        {appointment?.patientPackageId && (
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <Badge variant="success">Covered by package</Badge>
            <span className="text-muted-foreground">
              {packageCreditLabel(appointment.packageCredit)}
            </span>
          </p>
        )}
        {!isEdit && pendingPackageId && (
          <p className="mt-1.5">
            <Badge variant="info">Package will be applied when you create this appointment</Badge>
          </p>
        )}
      </div>

      {isEdit && appointment && payment && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">Payment status</p>
                <Badge variant={payment.variant}>
                  <IconCreditCard className="size-3" />
                  {payment.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{payment.detail}</p>
            </div>
            {appointment.patientPackageId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={releasePending}
                onClick={onRelease}
              >
                {releasePending ? <ButtonSpinner className="mr-0" /> : 'Remove package'}
              </Button>
            ) : (
              <Switch
                checked={appointment.isPaid}
                disabled={paidPending}
                onCheckedChange={onTogglePaid}
              />
            )}
          </div>
          {!appointment.isPaid && !appointment.patientPackageId && (
            <FormField label="Payment method">
              <OptionalSelect
                value={payMethodId}
                onChange={onPayMethodChange}
                placeholder="Select method"
                noneLabel="Select method"
                searchPlaceholder="Search payment methods…"
                options={paymentMethods.map((method) => ({
                  value: method.id,
                  label: method.name,
                }))}
              />
            </FormField>
          )}
        </div>
      )}
    </FormSection>
  );
}
