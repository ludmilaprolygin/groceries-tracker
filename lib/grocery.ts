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
