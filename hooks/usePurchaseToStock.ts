"use client"

import { useCallback, useState } from "react"
import { useData } from "@/components/providers/DataProvider"
import { toast } from "@/hooks/use-toast"
import { findStockItemByName } from "@/lib/grocery"
import { UNSORTED_LOCATION } from "@/lib/locations"
import type { GroceryItem, ShoppingItem } from "@/lib/types"

function plainLocations(item: GroceryItem) {
  return item.storageLocations.map(({ location, quantity }) => ({ location, quantity }))
}

/**
 * Checking a shopping-list entry adds its quantity to the stock; unchecking it takes it back out.
 * The stock location used is saved on the entry (`stockedLocation`) so the undo is exact.
 */
export function usePurchaseToStock() {
  const { items, createGroceryItem, updateGroceryItem, deleteGroceryItem, updateShoppingItem } = useData()
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const addToStock = useCallback(
    async (entry: ShoppingItem) => {
      const stockItem =
        (entry.groceryItemId && items.find((item) => item.id === entry.groceryItemId)) ||
        findStockItemByName(items, entry.name)

      if (!stockItem) {
        const created = await createGroceryItem(
          {
            name: entry.name,
            storageLocations: [{ location: UNSORTED_LOCATION, quantity: entry.quantity }],
            allowedUsers: [],
            categoryId: entry.categoryId ?? undefined,
          },
          { silent: true },
        )
        return { groceryItemId: created.id, stockedLocation: UNSORTED_LOCATION }
      }

      // Prefer the location the entry came from (low-stock items), else the item's main one
      const location =
        stockItem.storageLocations.find((loc) => loc.location === entry.location)?.location ??
        stockItem.storageLocations[0]?.location ??
        UNSORTED_LOCATION

      const locations = plainLocations(stockItem)
      const existing = locations.find((loc) => loc.location === location)
      if (existing) existing.quantity += entry.quantity
      else locations.push({ location, quantity: entry.quantity })

      await updateGroceryItem(
        stockItem.id,
        {
          storageLocations: locations,
          // Fill in the category if the stock item didn't have one
          ...(!stockItem.category && entry.categoryId ? { categoryId: entry.categoryId } : {}),
        },
        { silent: true },
      )
      return { groceryItemId: stockItem.id, stockedLocation: location }
    },
    [items, createGroceryItem, updateGroceryItem],
  )

  /** Undoes `addToStock`. Returns false when the stock item was removed because it ran out. */
  const removeFromStock = useCallback(
    async (entry: ShoppingItem) => {
      const stockItem = items.find((item) => item.id === entry.groceryItemId)
      if (!stockItem || !entry.stockedLocation) return true

      const locations = plainLocations(stockItem)
        .map((loc) => (loc.location === entry.stockedLocation ? { ...loc, quantity: loc.quantity - entry.quantity } : loc))
        .filter((loc) => loc.quantity > 0)

      if (locations.length === 0) {
        await deleteGroceryItem(stockItem.id, { silent: true })
        return false
      }
      await updateGroceryItem(stockItem.id, { storageLocations: locations }, { silent: true })
      return true
    },
    [items, deleteGroceryItem, updateGroceryItem],
  )

  const togglePurchased = useCallback(
    async (entry: ShoppingItem) => {
      if (busyIds.has(entry.id)) return
      setBusyIds((prev) => new Set(prev).add(entry.id))
      try {
        if (!entry.isCompleted) {
          const link = await addToStock(entry)
          await updateShoppingItem(entry.id, { isCompleted: true, ...link })
          toast({ title: `${entry.name}: +${entry.quantity} al stock`, description: link.stockedLocation })
        } else {
          // Entries checked before this feature existed never touched the stock
          const wasStocked = Boolean(entry.stockedLocation)
          const stillExists = await removeFromStock(entry)
          await updateShoppingItem(entry.id, {
            isCompleted: false,
            stockedLocation: null,
            ...(stillExists ? {} : { groceryItemId: null }),
          })
          if (wasStocked) toast({ title: `${entry.name}: −${entry.quantity} del stock` })
        }
      } catch {
        // Errors are already reported by the data layer
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev)
          next.delete(entry.id)
          return next
        })
      }
    },
    [busyIds, addToStock, removeFromStock, updateShoppingItem],
  )

  return { togglePurchased, busyIds }
}
