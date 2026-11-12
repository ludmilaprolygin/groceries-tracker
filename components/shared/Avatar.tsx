import { cn } from "@/lib/utils"

const SIZES = { sm: "h-6 w-6 text-[10px]", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" }

interface AvatarProps {
  name: string
  color?: string
  size?: keyof typeof SIZES
  className?: string
}

/** Initial-letter avatar with a small colour badge identifying the member. */
export function Avatar({ name, color, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium uppercase text-secondary-foreground ring-1 ring-border",
        SIZES[size],
        className,
      )}
      title={name}
    >
      {name.charAt(0)}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white/80",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          color ?? "bg-stone-400",
        )}
      />
    </span>
  )
}
