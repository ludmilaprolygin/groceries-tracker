"use client"

import { ShoppingBasket } from "lucide-react"
import { useData } from "@/components/providers/DataProvider"
import { EmptyState } from "@/components/shared/EmptyState"
import { FieldLabel } from "@/components/shared/FieldLabel"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { LowStockBanner } from "@/components/shopping/LowStockBanner"
import { MasOnlineCartDialog } from "@/components/shopping/MasOnlineCartDialog"
import { ShoppingItemDialog } from "@/components/shopping/ShoppingItemDialog"
import { ShoppingProgress } from "@/components/shopping/ShoppingProgress"
import { ShoppingRow } from "@/components/shopping/ShoppingRow"
import { usePurchaseToStock } from "@/hooks/usePurchaseToStock"
import { findStockItemByName, isLowStock, today } from "@/lib/grocery"
import type { ShoppingItem } from "@/lib/types"

export function ShoppingView() {
  const { items, categories, shoppingList, createShoppingItem, deleteShoppingItem } = useData()
  const { togglePurchased, busyIds } = usePurchaseToStock()

  const lowStockItems = items.filter(isLowStock)
  const pending = shoppingList.filter((item) => !item.isCompleted)
  const completed = shoppingList.filter((item) => item.isCompleted)
  const progress = shoppingList.length ? Math.round((completed.length / shoppingList.length) * 100) : 0

  const deleteItem = (item: ShoppingItem) => deleteShoppingItem(item.id)

  const addLowStockToList = async () => {
    const missing = lowStockItems.filter(
      (stockItem) =>
        !shoppingList.some(
          (shopItem) => shopItem.groceryItemId === stockItem.id || findStockItemByName([stockItem], shopItem.name),
        ),
    )
    for (const item of missing) {
      await createShoppingItem({
        name: item.name,
        quantity: 1,
        location: item.storageLocations[0]?.location || "Unknown",
        isCompleted: false,
        addedDate: today(),
        categoryId: item.category?.id ?? null,
        groceryItemId: item.id,
      })
    }
  }

  const renderRows = (list: ShoppingItem[]) =>
    list.map((item) => (
      <ShoppingRow
        key={item.id}
        item={item}
        category={categories.find((category) => category.id === item.categoryId)}
        busy={busyIds.has(item.id)}
        onToggle={togglePurchased}
        onDelete={deleteItem}
      />
    ))

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="Para comprar"
        title="Lista de compras"
        description={
          shoppingList.length
            ? `${pending.length} ${pending.length === 1 ? "pendiente" : "pendientes"} · ${completed.length} en el changuito`
            : undefined
        }
        action={<ShoppingItemDialog />}
      />

      {shoppingList.length > 0 && <ShoppingProgress value={progress} />}

      {lowStockItems.length > 0 && <LowStockBanner count={lowStockItems.length} onAddAll={addLowStockToList} />}

      {pending.length > 0 && <MasOnlineCartDialog items={pending} />}

      {shoppingList.length === 0 ? (
        <div className="glass rounded-lg">
          <EmptyState
            icon={<ShoppingBasket className="h-5 w-5" />}
            title="No hay nada para comprar"
            description="Agregá items a mano o sumá los que se están acabando en tu stock."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <ul className="glass divide-y divide-border/70 overflow-hidden rounded-lg">{renderRows(pending)}</ul>
          )}
          {completed.length > 0 && (
            <div className="space-y-2.5">
              <FieldLabel className="block px-1">En el changuito</FieldLabel>
              <ul className="glass divide-y divide-border/70 overflow-hidden rounded-lg opacity-80">
                {renderRows(completed)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
