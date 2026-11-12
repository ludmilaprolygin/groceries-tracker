"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CategoryChips } from "@/components/shared/CategoryChips"
import { FieldLabel } from "@/components/shared/FieldLabel"
import { QuantityAdjuster } from "@/components/shared/QuantityAdjuster"
import { ProductCombobox } from "@/components/shopping/ProductCombobox"
import { findStockItemByName, getTotalQuantity } from "@/lib/grocery"
import { UNSORTED_LOCATION } from "@/lib/locations"
import type { Category, GroceryItem } from "@/lib/types"

export interface ShoppingItemValues {
  name: string
  quantity: number
  categoryId: string | null
  /** Stock item with the same name, if there is one. */
  groceryItemId: string | null
}

interface ShoppingItemFormProps {
  items: GroceryItem[]
  categories: Category[]
  onSubmit: (values: ShoppingItemValues) => void | Promise<void>
}

export function ShoppingItemForm({ items, categories, onSubmit }: ShoppingItemFormProps) {
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const stockItem = name.trim() ? findStockItemByName(items, name) : undefined

  const handleNameChange = (next: string) => {
    setName(next)
    // Typing the exact name of a stock product picks up its category
    const match = findStockItemByName(items, next)
    if (match?.category) setCategoryId(match.category.id)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      // Reuse the stock spelling so both lists stay in sync
      name: stockItem?.name ?? name.trim(),
      quantity,
      categoryId,
      groceryItemId: stockItem?.id ?? null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-7 pt-2">
      <div className="grid gap-2">
        <FieldLabel htmlFor="shopping-item-name">Producto</FieldLabel>
        <ProductCombobox
          id="shopping-item-name"
          items={items}
          value={name}
          onChange={handleNameChange}
          onSelectItem={(item) => setCategoryId(item.category?.id ?? null)}
          placeholder="Buscá en tu stock o escribí uno nuevo"
          autoFocus
        />
        {name.trim() && (
          <p className="px-1 text-xs text-muted-foreground">
            {stockItem
              ? `Ya está en tu stock (${getTotalQuantity(stockItem)}). Al comprarlo se suma ahí.`
              : `Producto nuevo: al comprarlo se agrega al stock en “${UNSORTED_LOCATION}”.`}
          </p>
        )}
      </div>

      <div className="grid gap-2.5">
        <FieldLabel>
          Categoría <span className="normal-case tracking-normal text-muted-foreground/70">· opcional</span>
        </FieldLabel>
        <CategoryChips
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          noneLabel="Ninguna"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border glass-control py-2 pl-4 pr-2">
        <div>
          <p className="text-sm font-medium">Cantidad</p>
          <p className="text-xs text-muted-foreground">Va directo a tu lista</p>
        </div>
        <QuantityAdjuster value={quantity} onChange={setQuantity} min={1} max={999} />
      </div>

      <Button type="submit" className="h-12 w-full text-[15px]" disabled={!name.trim()}>
        Agregar a la lista
      </Button>
    </form>
  )
}
