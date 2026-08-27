'use client';

import { Input } from '@/components/ui';
import { FormField } from './form-field';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  nameAr: string;
  onNameChange: (value: string) => void;
  onNameArChange: (value: string) => void;
  nameId?: string;
  nameArId?: string;

  required?: boolean;
  maxLength?: number;
  className?: string;
  englishError?: string;
  arabicError?: string;
};


export function BilingualNameFields({
  name,
  nameAr,
  onNameChange,
  onNameArChange,
  nameId = 'name-en',
  nameArId = 'name-ar',
  required = true,
  maxLength = 60,
  className,
  englishError,
  arabicError,
}: Props) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
      <FormField label="Name (English)" htmlFor={nameId} required={required} error={englishError}>
        <Input
          id={nameId}
          maxLength={maxLength}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="English name"
          autoComplete="off"
        />
      </FormField>
      <FormField label="Name (Arabic)" htmlFor={nameArId} error={arabicError}>
        <Input
          id={nameArId}
          dir="rtl"
          lang="ar"
          maxLength={maxLength}
          value={nameAr}
          onChange={(e) => onNameArChange(e.target.value)}
          placeholder="الاسم بالعربي"
          autoComplete="off"
          className="text-right"
        />
      </FormField>
    </div>
  );
}


export function optionalArabicName(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
