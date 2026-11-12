import type React from "react"
import { cn } from "@/lib/utils"

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }

/** Selectable pill used for filters and option pickers. */
export function Chip({ active, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "glass-control border-border text-foreground hover:border-foreground/30 hover:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
