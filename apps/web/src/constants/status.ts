import type { TemplateStatus } from '@clinic/types';
import type { BadgeVariant } from '@/components/ui';

export const TEMPLATE_STATUS_VARIANT: Record<TemplateStatus, BadgeVariant> = {
  draft: 'info',
  scheduled: 'warning',
  published: 'success',
  archived: 'muted',
};
