import type React from "react"
import { cn } from "@/lib/utils"

interface StatProps {
  label: string
  value: React.ReactNode
  tone?: "warning" | "success"
}

export function Stat({ label, value, tone }: StatProps) {
  return (
    <div className="px-4 py-4 md:px-6 md:py-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-3xl leading-none tabular-nums md:text-4xl",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
    </div>
  )
}
