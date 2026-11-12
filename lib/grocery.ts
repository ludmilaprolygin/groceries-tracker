import { LOW_STOCK_THRESHOLD } from "@/lib/constants"
import type { GroceryItem } from "@/lib/types"

export function getTotalQuantity(item: GroceryItem): number {
  return item.storageLocations.reduce((total, location) => total + location.quantity, 0)
}

export function isLowStock(item: GroceryItem): boolean {
  return getTotalQuantity(item) <= LOW_STOCK_THRESHOLD
}

/** Today's date as YYYY-MM-DD, the format the database expects for `added_date`. */
export function today(): string {
  return new Date().toISOString().split("T")[0]
}

/** Normalized product name for comparisons ("Leche  Entera" → "leche entera"). */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Stock item with the same (normalized) name, if any. */
export function findStockItemByName(items: GroceryItem[], name: string): GroceryItem | undefined {
  const key = normalizeName(name)
  return items.find((item) => normalizeName(item.name) === key)
}
