"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CategoryChips } from "@/components/shared/CategoryChips"
import { Chip } from "@/components/shared/Chip"
import { Dot } from "@/components/shared/Dot"
import { FieldLabel } from "@/components/shared/FieldLabel"
import { QuantityAdjuster } from "@/components/shared/QuantityAdjuster"
import { LocationGrid } from "@/components/stock/LocationGrid"
import { ALL_LOCATIONS, STORAGE_AREAS, getLocationsForArea, type StorageArea } from "@/lib/locations"
import type { Category, GroceryItem, User } from "@/lib/types"

/** Values submitted by the form, ready to be persisted. */
export interface StockItemValues {
  name: string
  storageLocations: { location: string; quantity: number }[]
  allowedUsers: string[]
  categoryId: string | undefined
}

interface DraftLocation {
  location: string
  quantity: string
}

interface StockItemFormProps {
  /** Item being edited; omit to create a new one. */
  item?: GroceryItem | null
  users: User[]
  categories: Category[]
  onSubmit: (values: StockItemValues) => void | Promise<void>
}

function toValidLocations(locations: DraftLocation[]) {
  return locations
    .filter((loc) => loc.location && Number.parseInt(loc.quantity) > 0)
    .map((loc) => ({ location: loc.location, quantity: Number.parseInt(loc.quantity) }))
}

export function StockItemForm({ item, users, categories, onSubmit }: StockItemFormProps) {
  const [name, setName] = useState(item?.name ?? "")
  const [categoryId, setCategoryId] = useState<string | undefined>(item?.category?.id)
  const [allowedUsers, setAllowedUsers] = useState<string[]>(item?.allowedUsers ?? [])
  const [area, setArea] = useState<StorageArea | null>(null)
  const [storageLocations, setStorageLocations] = useState<DraftLocation[]>(
    item?.storageLocations.map((loc) => ({ location: loc.location, quantity: loc.quantity.toString() })) ?? [],
  )
  // Grid cell ids, kept in the same order as `storageLocations` when picked from the grid
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    item?.storageLocations.map((loc) => ALL_LOCATIONS.find((l) => l.name === loc.location)?.id ?? loc.location) ?? [],
  )

  const validLocations = toValidLocations(storageLocations)
  const canSubmit = name.trim() !== "" && validLocations.length > 0

  const changeArea = () => {
    setArea(null)
    setSelectedLocations([])
    setStorageLocations([])
  }

  const updateLocation = (index: number, field: keyof DraftLocation, value: string) => {
    if (field === "quantity" && value === "0") {
      // A location with quantity 0 is removed
      setStorageLocations((prev) => prev.filter((_, i) => i !== index))
      setSelectedLocations((prev) => prev.filter((_, i) => i !== index))
    } else {
      setStorageLocations((prev) => prev.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc)))
    }
  }

  const locationName = (locationId: string) =>
    (area === "lavadero" || area === "cocina" ? getLocationsForArea(area) : []).find((loc) => loc.id === locationId)
      ?.name ?? locationId

  const toggleUser = (userId: string) =>
    setAllowedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ name: name.trim(), storageLocations: validLocations, allowedUsers, categoryId })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-7 pt-2">
      <div className="grid gap-2">
        <FieldLabel htmlFor="item-name">Producto</FieldLabel>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej.: Aceite de oliva, Leche, Pan"
          className="h-12 text-base"
          autoFocus
        />
      </div>

      <div className="grid gap-2.5">
        <FieldLabel>
          Categoría <span className="normal-case tracking-normal text-muted-foreground/70">· opcional</span>
        </FieldLabel>
        <CategoryChips
          categories={categories}
          value={categoryId ?? null}
          onChange={(id) => setCategoryId(id ?? undefined)}
          noneLabel="Ninguna"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0"
        />
      </div>

      {!area ? (
        <div className="grid gap-2.5">
          <FieldLabel>¿Dónde se guarda?</FieldLabel>
          <div className="grid grid-cols-3 gap-2.5">
            {STORAGE_AREAS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setArea(option.id)}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border glass-control text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm"
              >
                <span className="text-2xl leading-none">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={area === "otros" ? "grid gap-3" : "grid gap-4"}>
          <div className="flex items-center justify-between">
            <FieldLabel>{area === "otros" ? "Ubicaciones personalizadas" : "Área de guardado"}</FieldLabel>
            <Button type="button" variant="ghost" size="sm" className="-mr-2 h-8 text-muted-foreground" onClick={changeArea}>
              <ArrowLeft className="!size-3.5" />
              Cambiar área
            </Button>
          </div>

          {area === "otros" ? (
            <div className="space-y-2.5">
              {storageLocations.length === 0 && (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Agregá tu primera ubicación
                </div>
              )}
              {storageLocations.map((location, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border glass-control p-2 pl-3">
                  <Input
                    placeholder="Nombre de la ubicación"
                    value={location.location}
                    onChange={(e) => updateLocation(index, "location", e.target.value)}
                    className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
                  />
                  <QuantityAdjuster
                    value={Number.parseInt(location.quantity) || 0}
                    onChange={(value) => updateLocation(index, "quantity", value.toString())}
                    min={0}
                    max={999}
                  />
                  {storageLocations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar ubicación"
                      onClick={() => setStorageLocations((prev) => prev.filter((_, i) => i !== index))}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="!size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStorageLocations((prev) => [...prev, { location: "", quantity: "1" }])}
                className="h-11 w-full border-dashed"
              >
                <Plus /> Agregar ubicación
              </Button>
            </div>
          ) : (
            <>
              <LocationGrid
                locationType={area}
                selectedLocations={selectedLocations}
                onLocationSelect={(locationId) => {
                  setSelectedLocations((prev) => [...prev, locationId])
                  setStorageLocations((prev) => [...prev, { location: locationName(locationId), quantity: "1" }])
                }}
                onLocationDeselect={(locationId) => {
                  const name = locationName(locationId)
                  setSelectedLocations((prev) => prev.filter((id) => id !== locationId))
                  setStorageLocations((prev) => prev.filter((loc) => loc.location !== name))
                }}
              />

              {storageLocations.length > 0 && (
                <div className="grid gap-2.5">
                  <FieldLabel>Cantidades</FieldLabel>
                  <div className="divide-y rounded-lg border glass-control">
                    {storageLocations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 py-2 pl-4 pr-2">
                        <span className="truncate text-sm font-medium">{location.location}</span>
                        <QuantityAdjuster
                          value={Number.parseInt(location.quantity) || 0}
                          onChange={(value) => updateLocation(index, "quantity", value.toString())}
                          min={0}
                          max={999}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {area && (
        <div className="grid gap-2.5">
          <FieldLabel>Compartido con</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <Chip key={user.id} active={allowedUsers.includes(user.id)} onClick={() => toggleUser(user.id)}>
                <Dot color={user.color} className="ring-1 ring-white/40" />
                {user.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {area && validLocations.length > 0 && (
        <Button type="submit" className="h-12 w-full text-[15px]" disabled={!canSubmit}>
          {item ? "Guardar cambios" : "Agregar al stock"}
        </Button>
      )}
    </form>
  )
}
