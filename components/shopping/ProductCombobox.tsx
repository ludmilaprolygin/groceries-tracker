"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Command as CommandPrimitive } from "cmdk"
import { ChevronDown, Package, Plus, Search } from "lucide-react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { getTotalQuantity, normalizeName } from "@/lib/grocery"
import type { GroceryItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProductComboboxProps {
  id?: string
  /** Stock items offered as suggestions. */
  items: GroceryItem[]
  value: string
  onChange: (name: string) => void
  /** Called when a stock item is picked from the list. */
  onSelectItem: (item: GroceryItem) => void
  placeholder?: string
  autoFocus?: boolean
}

/**
 * Free-text product input with a searchable list of the products already in stock,
 * so shopping-list entries can reuse the exact stock name.
 */
export function ProductCombobox({
  id,
  items,
  value,
  onChange,
  onSelectItem,
  placeholder,
  autoFocus,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false)

  const query = normalizeName(value)
  const suggestions = useMemo(() => {
    const matches = items.filter((item) => normalizeName(item.name).includes(query))
    // Names starting with the query first, then alphabetically
    return matches.sort((a, b) => {
      const aStarts = normalizeName(a.name).startsWith(query) ? 0 : 1
      const bStarts = normalizeName(b.name).startsWith(query) ? 0 : 1
      return aStarts - bStarts || a.name.localeCompare(b.name, "es")
    })
  }, [items, query])

  const hasExactMatch = items.some((item) => normalizeName(item.name) === query)
  const showCreate = query !== "" && !hasExactMatch
  const showList = open && (suggestions.length > 0 || showCreate)

  const selectItem = (item: GroceryItem) => {
    onChange(item.name)
    onSelectItem(item)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !showList) {
      // cmdk swallows Enter; with the list closed it should submit the form
      e.currentTarget.form?.requestSubmit()
    } else if (e.key === "ArrowDown" && !open) {
      setOpen(true)
    }
  }

  return (
    <Command shouldFilter={false} loop className="overflow-visible bg-transparent">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <CommandPrimitive.Input
          id={id}
          value={value}
          onValueChange={(next) => {
            onChange(next)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="flex h-12 w-full rounded-md border border-input bg-transparent pl-10 pr-11 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Cerrar sugerencias" : "Ver productos del stock"}
          // Keep focus in the input so the list stays open
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {showList && (
        <CommandList
          // Rendered in flow (not floating) so the dialog's scroll container never clips it
          className="mt-1.5 max-h-60 rounded-lg border bg-popover shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.length > 0 && (
            <CommandGroup heading="En tu stock">
              {suggestions.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => selectItem(item)}
                  className="gap-3 py-2.5"
                >
                  <span className="flex w-5 justify-center text-base leading-none">
                    {item.category?.icon ?? <Package className="text-muted-foreground" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {getTotalQuantity(item)} en stock
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {showCreate && (
            <CommandGroup heading="Nuevo">
              <CommandItem value="__new__" onSelect={() => setOpen(false)} className="gap-3 py-2.5">
                <Plus className="text-muted-foreground" />
                <span className="truncate">
                  Agregar “{value.trim()}” como producto nuevo
                </span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      )}
    </Command>
  )
}
