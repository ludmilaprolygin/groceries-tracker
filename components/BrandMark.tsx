import { cn } from "@/lib/utils"

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M5 9h14l-1.2 9.6a2 2 0 0 1-2 1.4H8.2a2 2 0 0 1-2-1.4L5 9Z" strokeLinejoin="round" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" strokeLinecap="round" />
        </svg>
      </span>
      <span className={cn("font-display leading-none", compact ? "text-xl" : "text-2xl")}>
        Grocery Tracker
      </span>
    </div>
  )
}
