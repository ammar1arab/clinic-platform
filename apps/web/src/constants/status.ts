import type { TemplateStatus } from '@clinic/types';
import type { BadgeVariant } from '@/components/ui';

export const TEMPLATE_STATUS_VARIANT: Record<TemplateStatus, BadgeVariant> = {
  draft: 'info',
  scheduled: 'warning',
  published: 'success',
  archived: 'muted',
};

export const HIGHLIGHT_SURFACE_CLASS = 'border border-primary/40 bg-primary/5';
