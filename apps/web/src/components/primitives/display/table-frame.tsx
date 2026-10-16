import { cn } from "@/lib/utils";

export function TableFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "table-frame overflow-hidden rounded-xl border-0 bg-card p-px",
        className,
      )}
    >
      <div className="relative z-0 flex min-h-0 w-full min-w-0 flex-1 flex-col">
        {children}
      </div>
      <div aria-hidden className="table-aura" />
    </div>
  );
}
