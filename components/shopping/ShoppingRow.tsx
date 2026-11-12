"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ShoppingItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ShoppingRowProps {
  item: ShoppingItem
  onToggle: (item: ShoppingItem) => void
  onDelete: (item: ShoppingItem) => void
}

export function ShoppingRow({ item, onToggle, onDelete }: ShoppingRowProps) {
  return (
    <li className="group flex items-center gap-3 px-3 py-2 md:px-4">
      <button
        type="button"
        onClick={() => onToggle(item)}
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
          {item.isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
        </span>
      </button>

      <div className="min-w-0 flex-1">
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
