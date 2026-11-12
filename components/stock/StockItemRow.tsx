"use client"

import { useState } from "react"
import { ChevronDown, MapPin, Package, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useData } from "@/components/providers/DataProvider"
import { Avatar } from "@/components/shared/Avatar"
import { Dot } from "@/components/shared/Dot"
import { QuantityAdjuster } from "@/components/shared/QuantityAdjuster"
import { getTotalQuantity, isLowStock } from "@/lib/grocery"
import type { GroceryItem, StorageLocation } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StockItemRowProps {
  item: GroceryItem
  onEdit: (item: GroceryItem) => void
}

/** Collapsible stock row: summary on top, per-location quantities and actions when expanded. */
export function StockItemRow({ item, onEdit }: StockItemRowProps) {
  const { users, updateGroceryItem, deleteGroceryItem } = useData()
  const [isOpen, setIsOpen] = useState(false)

  const total = getTotalQuantity(item)
  const isLow = isLowStock(item)

  const handleQuantityChange = async (location: StorageLocation, quantity: number) => {
    const updatedLocations =
      quantity === 0
        ? item.storageLocations.filter((loc) => loc.id !== location.id)
        : item.storageLocations.map((loc) => (loc.id === location.id ? { ...loc, quantity } : loc))

    // Emptying the last location removes the item altogether
    if (updatedLocations.length === 0) {
      await deleteGroceryItem(item.id)
      return
    }

    await updateGroceryItem(item.id, {
      storageLocations: updatedLocations.map(({ location, quantity }) => ({ location, quantity })),
    })
  }

  return (
    <li>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/40 focus-visible:bg-white/40 focus-visible:outline-none dark:hover:bg-white/5 md:gap-4 md:px-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-foreground/[0.05] text-xl ring-1 ring-inset ring-foreground/5">
              {item.category?.icon ?? <Package className="h-4 w-4 text-muted-foreground" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium">{item.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                {item.category && (
                  <>
                    <Dot color={item.category.color} />
                    <span className="truncate">{item.category.name}</span>
                    <span aria-hidden>·</span>
                  </>
                )}
                <span className="shrink-0">
                  {item.storageLocations.length} {item.storageLocations.length !== 1 ? "ubicaciones" : "ubicación"}
                </span>
              </p>
            </div>

            <div className="hidden -space-x-1.5 md:flex">
              {item.allowedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId)
                return user ? <Avatar key={userId} name={user.name} color={user.color} size="sm" /> : null
              })}
            </div>

            <div className="flex w-12 shrink-0 flex-col items-end">
              <span className={cn("font-display text-[1.75rem] leading-none tabular-nums", isLow && "text-warning")}>
                {total}
              </span>
              {isLow && (
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-warning">Bajo</span>
              )}
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden [--radix-accordion-content-height:var(--radix-collapsible-content-height)] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-4 pb-4 md:px-5 md:pl-[5.25rem]">
            <div className="divide-y divide-border/70 rounded-md border border-border/70 bg-white/45 dark:bg-white/5">
              {item.storageLocations.map((location) => (
                <div key={location.id} className="flex items-center justify-between gap-3 py-2 pl-3.5 pr-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{location.location}</span>
                  </div>
                  <QuantityAdjuster
                    value={location.quantity}
                    onChange={(quantity) => handleQuantityChange(location, quantity)}
                    min={0}
                    max={999}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Agregado el {item.addedDate}</p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="!size-3.5" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGroceryItem(item.id)}
                  className="h-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="!size-3.5" /> Borrar
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
