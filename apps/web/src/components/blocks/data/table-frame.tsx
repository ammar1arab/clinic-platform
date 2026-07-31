import { cn } from '@/lib/utils';



export function TableFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card-aura overflow-hidden rounded-xl border-0 bg-card', className)}>
      {children}
    </div>
  );
}
