'use client';

import { passwordRequirements } from '@clinic/types';
import { useLanguage } from '@/providers/language-provider';
import { IconCheck, IconInfo } from '@/constants/icons';
import { cn } from '@/lib/utils';

export function PasswordStrength({ password, id }: { password: string; id?: string }) {
  const { t } = useLanguage();
  const requirements = passwordRequirements(password);
  return (
    <ul id={id} className="space-y-1 text-xs" aria-label={t.auth.passwordRules}>
      {(Object.keys(requirements) as Array<keyof typeof requirements>).map(key => {
        const met = requirements[key];
        const Icon = met ? IconCheck : IconInfo;
        return <li key={key} className={cn('flex items-center gap-2', met ? 'text-success' : 'text-muted-foreground')}>
          <Icon className="size-3.5" aria-hidden />
          <span>{t.auth.passwordCriteria[key]}</span>
          <span className="sr-only">{met ? t.auth.requirementMet : t.auth.requirementPending}</span>
        </li>;
      })}
    </ul>
  );
}
