'use client';

import type { EmploymentType } from '@clinic/types';
import { Badge } from '@/components/ui';
import { PRACTITIONER_EMPLOYMENT_VARIANT } from '@/constants/practitioner';
import { useLanguage } from '@/providers';

export function PractitionerEmploymentBadge({ type }: { type: EmploymentType | null }) {
  const { t } = useLanguage();
  return type ? (
    <Badge variant={PRACTITIONER_EMPLOYMENT_VARIANT[type]} className="font-normal">
      {t.constants.employment[type]}
    </Badge>
  ) : null;
}
