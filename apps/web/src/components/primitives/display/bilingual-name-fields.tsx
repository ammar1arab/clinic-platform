'use client';

import { useLanguage } from '@/providers/language-provider';

import { Input } from '@/components/ui';
import { FormField } from '../forms/form-field';
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
  const { t } = useLanguage();
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
      <FormField
        label={t.ui.nameEnglish}
        htmlFor={nameId}
        required={required}
        error={englishError}
      >
        <Input
          id={nameId}
          dir="ltr"
          lang="en"
          maxLength={maxLength}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t.ui.englishName}
          autoComplete="off"
        />
      </FormField>
      <FormField label={t.ui.nameArabic} htmlFor={nameArId} error={arabicError}>
        <Input
          id={nameArId}
          dir="rtl"
          lang="ar"
          maxLength={maxLength}
          value={nameAr}
          onChange={(e) => onNameArChange(e.target.value)}
          placeholder={t.ui.arabicName}
          autoComplete="off"
          className="text-start"
        />
      </FormField>
    </div>
  );
}

export function optionalArabicName(
  value: string | undefined | null,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
