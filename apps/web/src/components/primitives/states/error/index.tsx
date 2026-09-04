import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/providers";

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-14 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-1 rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {title ?? t?.errors?.generic ?? "Something went wrong"}
        </p>
        {description && (
          <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          {t?.common?.tryAgain}
        </Button>
      )}
    </div>
  );
}
