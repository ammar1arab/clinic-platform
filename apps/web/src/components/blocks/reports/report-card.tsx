import { IconWell } from '@/components/primitives';
import type { LucideIcon } from '@/constants/icons';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function ReportCard({ icon, title, description, children }: Props) {
  return (
    <section className="card-aura flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <IconWell icon={icon} size="md" accent="default" />
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-semibold leading-none">{title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}
