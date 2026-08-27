"use client"

import { useTheme } from "next-themes"
import { IconCheckCircle, IconError, IconInfo, IconSpinner, IconWarning } from '@/constants/icons'
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <IconCheckCircle className="size-4" />
        ),
        info: (
          <IconInfo className="size-4" />
        ),
        warning: (
          <IconWarning className="size-4" />
        ),
        error: (
          <IconError className="size-4" />
        ),
        loading: (
          <IconSpinner className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
