import { cn } from "@/lib/utils"

export function Dot({ color, className }: { color?: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2 w-2 shrink-0 rounded-full", color ?? "bg-stone-400", className)} />
}
