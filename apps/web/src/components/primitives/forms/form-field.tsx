"use client";

import { useId, type ReactNode } from "react";
import { useLanguage } from "@/providers/language-provider";
import { FORM_ANY } from "@/constants/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { IconClose } from "@/constants/icons";

type FormFieldProps = {
  label?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
};

export function FormField({
  label,
  error,
  required,
  htmlFor,
  hint,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {label != null && label !== "" ? (
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
          {required ? <span className="ms-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const id = useId();
  const anyText = placeholder ?? t.common.any;
  const active = !!value;
  return (
    <FormField htmlFor={id} label={label} labelClassName="text-xs">
      <div className="relative">
        <Select
          value={value || FORM_ANY}
          onValueChange={(v) => onChange(v === FORM_ANY ? "" : v)}
        >
          <SelectTrigger
            id={id}
            className={cn("h-8 w-full rounded-lg", active && "border-primary/40 bg-primary/5 pe-14")}
          >
            <SelectValue placeholder={anyText} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FORM_ANY}>{anyText}</SelectItem>
            {children}
          </SelectContent>
        </Select>
        {active ? (
          <button
            type="button"
            aria-label={t.common.clear}
            onClick={() => onChange("")}
            className="absolute inset-y-0 end-7 my-auto grid size-5 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconClose className="size-3" />
          </button>
        ) : null}
      </div>
    </FormField>
  );
}
