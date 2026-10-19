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
        "group/selection size-5 shrink-0 rounded-full border border-primary/50 bg-background p-0 text-primary shadow-none transition-[background-color,border-color,transform] duration-(--motion-fast) hover:border-primary hover:bg-primary/5 hover:text-primary aria-expanded:text-primary focus-visible:border-primary focus-visible:ring-0 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none [@media(pointer:coarse)]:size-7",
        checked && "border-primary bg-primary/10 hover:bg-primary/15",
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
          "size-2 rounded-full bg-primary transition-[opacity,transform] duration-(--motion-normal) motion-reduce:transition-none",
          checked === "mixed" && "scale-50",
          !checked && "scale-50 opacity-0",
        )}
      />
    </Button>
  );
}
