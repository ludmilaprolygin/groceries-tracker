"use client"

import { useMemo, useState } from "react"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useData } from "@/components/providers/DataProvider"
import { EmptyState } from "@/components/shared/EmptyState"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StockFilters } from "@/components/stock/StockFilters"
import { StockItemDialog } from "@/components/stock/StockItemDialog"
import { StockItemRow } from "@/components/stock/StockItemRow"
import { StockStats } from "@/components/stock/StockStats"
import { useDebounce } from "@/hooks/useDebounce"
import { getTotalQuantity, isLowStock } from "@/lib/grocery"
import type { GroceryItem } from "@/lib/types"

export function StockView() {
  const { items, categories } = useData()

  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.toLowerCase()
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.storageLocations.some((loc) => loc.location.toLowerCase().includes(q))
      const matchesCategory = categoryFilter ? item.category?.id === categoryFilter : true
      return matchesSearch && matchesCategory
    })
  }, [items, debouncedQuery, categoryFilter])

  const lowStockCount = items.filter(isLowStock).length
  const totalQuantity = items.reduce((total, item) => total + getTotalQuantity(item), 0)
  const isFiltering = Boolean(debouncedQuery || categoryFilter)

  const openDialog = (item: GroceryItem | null) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow={new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        title="Stock"
        action={
          <Button onClick={() => openDialog(null)} className="h-10">
            <Plus />
            <span className="hidden sm:inline">Agregar item</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        }
      />

      <StockStats
        itemCount={items.length}
        lowStockCount={lowStockCount}
        totalQuantity={totalQuantity}
        categoryCount={categories.length}
      />

      <StockFilters
        query={query}
        onQueryChange={setQuery}
        categories={categories}
        categoryId={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      <div className="glass overflow-hidden rounded-lg">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title={isFiltering ? "Sin resultados" : "Tu stock está vacío"}
            description={
              isFiltering
                ? "Probá con otra búsqueda o categoría."
                : "Agregá tu primer item para empezar a registrar lo que tenés en casa."
            }
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {filteredItems.map((item) => (
              <StockItemRow key={item.id} item={item} onEdit={openDialog} />
            ))}
          </ul>
        )}
      </div>

      <StockItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} />
    </div>
  )
}
