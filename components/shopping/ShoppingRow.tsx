"use client"

import { Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Category, ShoppingItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ShoppingRowProps {
  item: ShoppingItem
  category?: Category
  /** Stock is being updated for this entry. */
  busy?: boolean
  onToggle: (item: ShoppingItem) => void
  onDelete: (item: ShoppingItem) => void
}

export function ShoppingRow({ item, category, busy, onToggle, onDelete }: ShoppingRowProps) {
  return (
    <li className="group flex items-center gap-3 px-3 py-2 md:px-4">
      <button
        type="button"
        onClick={() => onToggle(item)}
        disabled={busy}
        aria-label={item.isCompleted ? `Marcar ${item.name} como pendiente` : `Marcar ${item.name} como comprado`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] transition-all",
            item.isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-foreground/25 group-hover:border-foreground/50",
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            item.isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {category && (
          <span className="shrink-0 text-base leading-none" title={category.name}>
            {category.icon}
          </span>
        )}
        <p
          className={cn(
            "truncate text-[15px] transition-colors",
            item.isCompleted && "text-muted-foreground line-through decoration-foreground/30",
          )}
        >
          {item.name}
        </p>
      </div>

      <span className="shrink-0 rounded-[4px] bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
        ×{item.quantity}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item)}
        aria-label={`Quitar ${item.name}`}
        className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="!size-4" />
      </Button>
    </li>
  )
}
