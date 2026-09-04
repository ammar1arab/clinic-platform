import { IconCard } from '@/components/primitives';
import type { LucideIcon } from '@/constants/icons';
import { forwardRef } from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const ReportCard = forwardRef<HTMLButtonElement, Props>(
  ({ icon, title, description, className, ...props }, ref) => {
    return (
      <IconCard
        ref={ref}
        icon={icon}
        title={title}
        description={description}
        orientation="vertical"
        className={className}
        {...props}
      />
    );
  }
);
ReportCard.displayName = 'ReportCard';
