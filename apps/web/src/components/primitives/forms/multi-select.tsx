'use client';

import { ChoiceChips } from './choice-chips';

export type MultiSelectOption = {
  value: string;
  label: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  label = '',
  className,
  disabled,
}: {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  return <ChoiceChips multiple label={label} options={options} value={value} onChange={onChange} disabled={disabled} className={className} />;
}
