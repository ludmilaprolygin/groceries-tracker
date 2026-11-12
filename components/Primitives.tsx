import type React from "react"
import { cn } from "@/lib/utils"

/**
 * Muted, earthy swatches used for categories and members.
 * Values are stored in the database as Tailwind classes, so they must stay literal here.
 */
export const NEUTRAL_SWATCHES = [
  "bg-stone-400",
  "bg-stone-600",
  "bg-stone-800",
  "bg-zinc-500",
  "bg-amber-700",
  "bg-orange-800",
  "bg-yellow-700",
  "bg-lime-800",
  "bg-emerald-800",
  "bg-teal-700",
  "bg-sky-800",
  "bg-rose-800",
]

export function Dot({ color, className }: { color?: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2 w-2 shrink-0 rounded-full", color ?? "bg-stone-400", className)} />
}

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string
  color?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizes = { sm: "h-6 w-6 text-[10px]", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" }
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium uppercase text-secondary-foreground ring-1 ring-border",
        sizes[size],
        className,
      )}
      title={name}
    >
      {name.charAt(0)}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-card",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          color ?? "bg-stone-400",
        )}
      />
    </span>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
        )}
        <h2 className="font-display text-3xl leading-none md:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

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

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </div>
      <p className="font-display text-xl">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warning" | "success" }) {
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

/** Selectable pill used for filters and option pickers. */
export function Chip({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-foreground/25 hover:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
