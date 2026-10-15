"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCopy } from "@/constants/icons";
import { useLanguage } from "@/providers";
import { Button } from "@/components/ui";

export function CopyButton({ value }: { value: string }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`${t.common.copyValue}: ${value}`}
      disabled={pending}
      className="size-5 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover/contact:opacity-100 sm:group-hover/directory:opacity-100 sm:focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      onClick={async (event) => {
        event.stopPropagation();
        setPending(true);
        try {
          await navigator.clipboard.writeText(value);
          toast.success(t.common.copied);
        } catch {
          toast.error(t.common.copyFailed);
        } finally {
          setPending(false);
        }
      }}
    >
      <IconCopy className="size-3" aria-hidden />
    </Button>
  );
}
