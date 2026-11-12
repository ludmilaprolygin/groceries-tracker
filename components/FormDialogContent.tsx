"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Chip, Dot, FieldLabel } from "@/components/Primitives"
import { LocationGrid, LAVADERO_LOCATIONS, COCINA_LOCATIONS } from "@/components/LocationGrid"
import { QuantityAdjuster } from "@/components/QuantityAdjuster"
import type { User, GroceryItem, Category } from "@/hooks/useDatabase"

interface FormDialogContentProps {
  formData: {
    name: string
    storageLocations: { location: string; quantity: string }[]
    allowedUsers: string[]
    selectedLocations: string[]
    locationCategory: "lavadero" | "cocina" | "otros" | null
    categoryId: string | undefined // ← Change this from categoryId?: string to categoryId: string | undefined
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      storageLocations: { location: string; quantity: string }[]
      allowedUsers: string[]
      selectedLocations: string[]
      locationCategory: "lavadero" | "cocina" | "otros" | null
      categoryId: string | undefined // ← Change this from categoryId?: string to categoryId: string | undefined
    }>
  >
  activeTab: string
  users: User[]
  categories: Category[]
  editingItem: GroceryItem | null
  updateStorageLocation: (index: number, field: "location" | "quantity", value: string) => void
  toggleUserSelection: (userId: string) => void
  handleAddItem: (e?: React.FormEvent) => void
  handleEditItem: (e?: React.FormEvent) => void
  handleAddToShoppingList: (e?: React.FormEvent) => void
}

export const FormDialogContent = React.memo(
  ({
    formData,
    setFormData,
    activeTab,
    users,
    categories,
    editingItem,
    updateStorageLocation,
    toggleUserSelection,
    handleAddItem,
    handleEditItem,
    handleAddToShoppingList,
  }: FormDialogContentProps) => {
    // Use local state for the name input to prevent parent re-renders
    const [localName, setLocalName] = useState(formData.name)

    // Sync local name with form data when dialog opens/closes
    useEffect(() => {
      setLocalName(formData.name)
    }, [formData.name])

    // Update form data with debounced name changes
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (localName !== formData.name) {
          setFormData((prev) => ({ ...prev, name: localName }))
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }, [localName, formData.name, setFormData])

    const canSubmitStock = formData.storageLocations.some(
      (loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0,
    )

    return (
      <div className="grid gap-7 pt-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="name">Product</FieldLabel>
          <Input
            id="name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="e.g. Olive oil, Oat milk, Bread"
            className="h-12 text-base"
            autoFocus
          />
        </div>

        {/* Category Selection */}
        <div className="grid gap-2.5">
          <FieldLabel>
            Category <span className="normal-case tracking-normal text-muted-foreground/70">· optional</span>
          </FieldLabel>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip
              active={!formData.categoryId}
              onClick={() => setFormData((prev) => ({ ...prev, categoryId: undefined }))}
            >
              None
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                active={formData.categoryId === category.id}
                onClick={() => setFormData((prev) => ({ ...prev, categoryId: category.id }))}
              >
                <span className="text-base leading-none">{category.icon}</span>
                {category.name}
              </Chip>
            ))}
          </div>
        </div>

        {activeTab === "stock" && (
          <>
            {!formData.locationCategory ? (
              <div className="grid gap-2.5">
                <FieldLabel>Where is it stored?</FieldLabel>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: "lavadero", label: "Lavadero", icon: "🧺" },
                      { id: "cocina", label: "Cocina", icon: "🍳" },
                      { id: "otros", label: "Otros", icon: "📦" },
                    ] as const
                  ).map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, locationCategory: area.id }))}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border bg-card text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm"
                    >
                      <span className="text-2xl leading-none">{area.icon}</span>
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : formData.locationCategory === "otros" ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <FieldLabel>Custom locations</FieldLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-mr-2 h-8 text-muted-foreground"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        locationCategory: null,
                        selectedLocations: [],
                        storageLocations: [],
                      }))
                    }
                  >
                    <ArrowLeft className="!size-3.5" />
                    Change area
                  </Button>
                </div>
                <div className="space-y-2.5">
                  {formData.storageLocations.length === 0 && (
                    <div className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                      Add your first custom location
                    </div>
                  )}
                  {formData.storageLocations.map((location, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-2xl border bg-card p-2 pl-3">
                      <Input
                        placeholder="Location name"
                        value={location.location}
                        onChange={(e) => updateStorageLocation(index, "location", e.target.value)}
                        className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
                      />
                      <QuantityAdjuster
                        value={Number.parseInt(location.quantity) || 0}
                        onChange={(value) => updateStorageLocation(index, "quantity", value.toString())}
                        min={0}
                        max={999}
                      />
                      {formData.storageLocations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove location"
                          onClick={() => {
                            const updated = formData.storageLocations.filter((_, i) => i !== index)
                            setFormData((prev) => ({ ...prev, storageLocations: updated }))
                          }}
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
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        storageLocations: [...prev.storageLocations, { location: "", quantity: "1" }],
                      }))
                    }
                    className="h-11 w-full border-dashed"
                  >
                    <Plus /> Add location
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <FieldLabel>Storage area</FieldLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-mr-2 h-8 text-muted-foreground"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        locationCategory: null,
                        selectedLocations: [],
                        storageLocations: [],
                      }))
                    }
                  >
                    <ArrowLeft className="!size-3.5" />
                    Change area
                  </Button>
                </div>
                <LocationGrid
                  locationType={formData.locationCategory}
                  selectedLocations={formData.selectedLocations}
                  onLocationSelect={(locationId) => {
                    const locationName =
                      (formData.locationCategory === "lavadero" ? LAVADERO_LOCATIONS : COCINA_LOCATIONS).find(
                        (loc) => loc.id === locationId,
                      )?.name || locationId
                    setFormData((prev) => ({
                      ...prev,
                      selectedLocations: [...prev.selectedLocations, locationId],
                      storageLocations: [...prev.storageLocations, { location: locationName, quantity: "1" }],
                    }))
                  }}
                  onLocationDeselect={(locationId) => {
                    const locationName =
                      (formData.locationCategory === "lavadero" ? LAVADERO_LOCATIONS : COCINA_LOCATIONS).find(
                        (loc) => loc.id === locationId,
                      )?.name || locationId
                    setFormData((prev) => ({
                      ...prev,
                      selectedLocations: prev.selectedLocations.filter((id) => id !== locationId),
                      storageLocations: prev.storageLocations.filter((loc) => loc.location !== locationName),
                    }))
                  }}
                />

                {formData.storageLocations.length > 0 && (
                  <div className="grid gap-2.5">
                    <FieldLabel>Quantities</FieldLabel>
                    <div className="divide-y rounded-2xl border bg-card">
                      {formData.storageLocations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 py-2 pl-4 pr-2">
                          <span className="truncate text-sm font-medium">{location.location}</span>
                          <QuantityAdjuster
                            value={Number.parseInt(location.quantity) || 0}
                            onChange={(value) => updateStorageLocation(index, "quantity", value.toString())}
                            min={0}
                            max={999}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.locationCategory && (
              <div className="grid gap-2.5">
                <FieldLabel>Shared with</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <Chip
                      key={user.id}
                      active={formData.allowedUsers.includes(user.id)}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <Dot color={user.color} className="ring-1 ring-white/40" />
                      {user.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "shopping" && (
          <div className="flex items-center justify-between rounded-2xl border bg-card py-2 pl-4 pr-2">
            <div>
              <p className="text-sm font-medium">Quantity</p>
              <p className="text-xs text-muted-foreground">Goes straight to your list</p>
            </div>
            <QuantityAdjuster
              value={Number.parseInt(formData.storageLocations[0]?.quantity) || 1}
              onChange={(value) => updateStorageLocation(0, "quantity", value.toString())}
              min={1}
              max={999}
            />
          </div>
        )}

        {/* Only show the submit button if we have the required data */}
        {(activeTab === "shopping" || (activeTab === "stock" && formData.locationCategory && canSubmitStock)) && (
          <Button
            onClick={(e) =>
              activeTab === "shopping" ? handleAddToShoppingList(e) : editingItem ? handleEditItem(e) : handleAddItem(e)
            }
            className="h-12 w-full text-[15px]"
            disabled={!localName.trim() || (activeTab === "stock" && !canSubmitStock)}
          >
            {activeTab === "shopping" ? "Add to list" : editingItem ? "Save changes" : "Add to pantry"}
          </Button>
        )}
      </div>
    )
  },
)

FormDialogContent.displayName = "FormDialogContent"