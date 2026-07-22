'use client';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputField({ value, onChange, className, disabled }: Props) {
  return (
    <PhoneInput
      international
      defaultCountry="JO"
      value={value}
      disabled={disabled}
      onChange={(val) => onChange(val ?? '')}
      className={cn(
        // Match the base <Input/> shell so all fields are visually consistent.
        'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors md:text-sm',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        'has-disabled:cursor-not-allowed has-disabled:opacity-50',
        'dark:bg-input/30',
        '[&_input]:min-w-0 [&_input]:flex-1 [&_input]:bg-transparent [&_input]:text-base [&_input]:outline-none md:[&_input]:text-sm [&_input]:placeholder:text-muted-foreground',
        '[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:shrink-0',
        '[&_.PhoneInputCountrySelectArrow]:opacity-60',
        className,
      )}
    />
  );
}
