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

  /**
   * Changes an entry's quantity. If it's already in the cart (and stocked), the stock at
   * `stockedLocation` is shifted by the difference so it keeps matching what was bought.
   */
  const changeQuantity = useCallback(
    async (entry: ShoppingItem, quantity: number) => {
      const delta = quantity - entry.quantity
      if (delta === 0 || quantity < 1 || busyIds.has(entry.id)) return
      setBusyIds((prev) => new Set(prev).add(entry.id))
      try {
        const stockItem = items.find((item) => item.id === entry.groceryItemId)
        if (!entry.isCompleted || !entry.stockedLocation || !stockItem) {
          await updateShoppingItem(entry.id, { quantity })
          return
        }

        const locations = plainLocations(stockItem)
        const existing = locations.find((loc) => loc.location === entry.stockedLocation)
        if (existing) existing.quantity += delta
        else locations.push({ location: entry.stockedLocation, quantity: delta })
        const remaining = locations.filter((loc) => loc.quantity > 0)

        if (remaining.length === 0) {
          await deleteGroceryItem(stockItem.id, { silent: true })
          await updateShoppingItem(entry.id, { quantity, groceryItemId: null, stockedLocation: null })
        } else {
          await updateGroceryItem(stockItem.id, { storageLocations: remaining }, { silent: true })
          await updateShoppingItem(entry.id, { quantity })
        }
        toast({
          title: `${entry.name}: ${delta > 0 ? "+" : "−"}${Math.abs(delta)} al stock`,
          description: entry.stockedLocation,
        })
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
    [busyIds, items, deleteGroceryItem, updateGroceryItem, updateShoppingItem],
  )

  return { togglePurchased, changeQuantity, busyIds }
}
