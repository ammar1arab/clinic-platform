export const PRACTITIONER_CALENDAR_COLORS = [
  'brand',
  'accent-teal',
  'primary',
  'success',
  'warning',
  'destructive',
] as const;

export type PractitionerCalendarColor =
  (typeof PRACTITIONER_CALENDAR_COLORS)[number];

export const PRACTITIONER_CALENDAR_COLOR_CLASS: Record<
  PractitionerCalendarColor,
  string
> = {
  brand: 'bg-brand',
  'accent-teal': 'bg-accent-teal',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};
