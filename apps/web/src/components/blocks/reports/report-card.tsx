import { IconCard, type IconWellAccent } from '@/components/primitives';
import type { LucideIcon } from '@/constants/icons';
import { forwardRef } from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: IconWellAccent;
};

export const ReportCard = forwardRef<HTMLButtonElement, Props>(
  ({ icon, title, description, accent, className, ...props }, ref) => {
    return (
      <IconCard
        ref={ref}
        icon={icon}
        title={title}
        description={description}
        accent={accent}
        orientation="vertical"
        className={className}
        {...props}
      />
    );
  }
);
ReportCard.displayName = 'ReportCard';

