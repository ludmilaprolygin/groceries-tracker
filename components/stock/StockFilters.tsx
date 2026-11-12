"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CategoryChips } from "@/components/shared/CategoryChips"
import type { Category } from "@/lib/types"

interface StockFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  categories: Category[]
  categoryId: string | null
  onCategoryChange: (categoryId: string | null) => void
}

export function StockFilters({ query, onQueryChange, categories, categoryId, onCategoryChange }: StockFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Buscar items"
          placeholder="Buscar por nombre o ubicación"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-12 rounded-md pl-11 pr-11 text-base md:text-sm" // text-base prevents zoom on iOS
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <CategoryChips
          categories={categories}
          value={categoryId}
          onChange={onCategoryChange}
          noneLabel="Todas"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0"
        />
      )}
    </div>
  )
}
