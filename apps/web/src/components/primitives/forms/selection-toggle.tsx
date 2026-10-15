"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SelectionToggle({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean | "mixed";
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "size-6 rounded-full border border-border bg-transparent text-primary transition-colors hover:bg-transparent focus-visible:border-primary",
        checked && "border-primary",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        onChange(checked !== true);
      }}
    >
      <span
        aria-hidden
        className={cn(
          "rounded-full bg-current transition-[opacity,scale] duration-150 size-3",
          checked === "mixed" && "size-1.5",
          !checked && "scale-50 opacity-0",
        )}
      />
    </Button>
  );
}
