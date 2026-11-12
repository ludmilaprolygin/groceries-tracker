import type React from "react"
import { cn } from "@/lib/utils"

export function FieldLabel({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", className)}
      {...props}
    >
      {children}
    </label>
  )
}
