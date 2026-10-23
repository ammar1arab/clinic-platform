import React, { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconWell, type IconWellAccent } from "./icon-well";
import type { LucideIcon } from "@/constants/icons";
import { Button } from "@/components/ui/forms/button";

export interface IconCardProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "title" | keyof React.DOMAttributes<HTMLButtonElement>
>, React.DOMAttributes<HTMLElement> {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: string;
  accent?: IconWellAccent;
  href?: string;
  active?: boolean;
  endContent?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
}

export const IconCard = forwardRef<HTMLButtonElement, IconCardProps>(
  (
    {
      icon,
      title,
      description,
      accent = "default",
      href,
      active,
      endContent,
      orientation = "horizontal",
      compact = false,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isHorizontal = orientation === "horizontal";
    const isInteractive = !!href || !!onClick;

    const content = (
      <>
        <IconWell
          icon={icon}
          size={isHorizontal && !compact ? "lg" : "md"}
          accent={active ? "default" : accent}
        />
        <span
          className={cn("min-w-0 flex-1 text-start", !isHorizontal && "pt-0.5")}
        >
          <span
            className={cn(
              "block font-semibold tracking-tight",
              isHorizontal ? "text-sm" : "text-sm leading-none",
              !active && !description && isHorizontal
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {title}
          </span>
          {description && (
            <span
              className={cn(
                "block text-xs text-muted-foreground transition-colors group-hover:text-foreground/80",
                isHorizontal
                  ? "mt-0.5 leading-relaxed"
                  : "mt-1.5 leading-relaxed",
              )}
            >
              {description}
            </span>
          )}
        </span>
        {endContent && <span className="shrink-0">{endContent}</span>}
      </>
    );

    const baseClasses = cn(
      "card-aura group flex w-full text-start whitespace-normal transition-colors duration-200 rounded-xl bg-card font-normal",
      "border-0 md:border",
      isInteractive && "md:hover:border-primary/40",
      isHorizontal
        ? compact ? "items-center justify-start gap-3 px-3 py-2.5 h-auto" : "items-center justify-start gap-4 px-4 py-3.5 h-auto"
        : "h-auto flex-col items-start gap-4 p-4 sm:p-5",
      className,
    );

    const wrapperClasses = isHorizontal ? "" : "flex w-full items-start gap-3";

    if (href) {
      return (
        <Button
          asChild
          variant="outline"
          className={baseClasses}
        >
          <Link
            href={href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
          >
            {isHorizontal ? content : <div className={wrapperClasses}>{content}</div>}
          </Link>
        </Button>
      );
    }

    if (!isInteractive) {
      const divProps = { ...props };
      delete divProps.type;
      delete divProps.disabled;
      delete divProps.form;
      delete divProps.formAction;
      delete divProps.formEncType;
      delete divProps.formMethod;
      delete divProps.formNoValidate;
      delete divProps.formTarget;
      delete divProps.name;
      delete divProps.value;

      return (
        <div
          className={cn(baseClasses, 'md:border-border')}
          {...divProps}
        >
          {isHorizontal ? content : <div className={wrapperClasses}>{content}</div>}
        </div>
      );
    }

    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={baseClasses}
        {...props}
      >
        {isHorizontal ? (
          content
        ) : (
          <div className={wrapperClasses}>{content}</div>
        )}
      </Button>
    );
  },
);
IconCard.displayName = "IconCard";
