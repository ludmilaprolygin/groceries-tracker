"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

    return (
      <div className="grid gap-6 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="e.g., Apples, Milk, Bread"
            className="text-base"
            autoFocus
          />
        </div>

        {/* Category Selection */}
        <div className="grid gap-2">
          <Label>Category (Optional)</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            <Button
              type="button"
              variant={!formData.categoryId ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, categoryId: undefined }))}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <span>📦</span>
              No Category
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={formData.categoryId === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData((prev) => ({ ...prev, categoryId: category.id }))}
                className="flex items-center gap-2 min-h-[44px]"
              >
                <span>{category.icon}</span>
                <Badge className={`${category.color} text-white text-xs`}>{category.name}</Badge>
              </Button>
            ))}
          </div>
        </div>

        {activeTab === "stock" && (
          <>
            {!formData.locationCategory ? (
              <div className="grid gap-4">
                <Label>Choose Storage Area</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData((prev) => ({ ...prev, locationCategory: "lavadero" }))}
                    className="min-h-[60px] md:min-h-[80px] text-base font-medium flex flex-col gap-2"
                  >
                    <span className="text-2xl">🧺</span>
                    Lavadero
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData((prev) => ({ ...prev, locationCategory: "cocina" }))}
                    className="min-h-[60px] md:min-h-[80px] text-base font-medium flex flex-col gap-2"
                  >
                    <span className="text-2xl">🍳</span>
                    Cocina
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData((prev) => ({ ...prev, locationCategory: "otros" }))}
                    className="min-h-[60px] md:min-h-[80px] text-base font-medium flex flex-col gap-2"
                  >
                    <span className="text-2xl">📦</span>
                    Otros
                  </Button>
                </div>
              </div>
            ) : formData.locationCategory === "otros" ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Custom Location</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        locationCategory: null,
                        selectedLocations: [],
                        storageLocations: [],
                      }))
                    }
                  >
                    ← Back
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.storageLocations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Click "Add Location" to add your first custom location
                    </div>
                  )}
                  {formData.storageLocations.map((location, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end p-3 border rounded-lg">
                      <div className="grid gap-2">
                        <Label>Location Name</Label>
                        <Input
                          placeholder="Enter location name"
                          value={location.location}
                          onChange={(e) => updateStorageLocation(index, "location", e.target.value)}
                          className="text-base"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Quantity</Label>
                        <div className="flex justify-center">
                          <QuantityAdjuster
                            value={Number.parseInt(location.quantity) || 0}
                            onChange={(value) => updateStorageLocation(index, "quantity", value.toString())}
                            min={0}
                            max={999}
                          />
                        </div>
                      </div>
                      {formData.storageLocations.length > 1 && (
                        <div className="col-span-1 md:col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = formData.storageLocations.filter((_, i) => i !== index)
                              setFormData((prev) => ({ ...prev, storageLocations: updated }))
                            }}
                            className="text-destructive hover:text-destructive w-full"
                          >
                            Remove Location
                          </Button>
                        </div>
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
                    className="w-full"
                  >
                    + Add Location
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Storage Locations - {formData.locationCategory === "lavadero" ? "Lavadero" : "Cocina"}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        locationCategory: null,
                        selectedLocations: [],
                        storageLocations: [],
                      }))
                    }
                  >
                    ← Back
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
                  <div className="space-y-3">
                    <Label>Adjust Quantities</Label>
                    {formData.storageLocations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{location.location}</span>
                        <QuantityAdjuster
                          value={Number.parseInt(location.quantity) || 0}
                          onChange={(value) => updateStorageLocation(index, "quantity", value.toString())}
                          min={0}
                          max={999}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.locationCategory && (
              <div className="grid gap-2">
                <Label>Allowed Users</Label>
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <Button
                      key={user.id}
                      type="button"
                      variant={formData.allowedUsers.includes(user.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleUserSelection(user.id)}
                      className="flex items-center gap-2 min-h-[44px]"
                    >
                      <div className={`w-3 h-3 rounded-full ${user.color}`} />
                      {user.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "shopping" && (
          <div className="grid gap-4">
            <div className="text-sm text-muted-foreground text-center">
              Items added here will go to your shopping list
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shop-quantity">Quantity</Label>
              <div className="flex justify-center">
                <QuantityAdjuster
                  value={Number.parseInt(formData.storageLocations[0]?.quantity) || 1}
                  onChange={(value) => updateStorageLocation(0, "quantity", value.toString())}
                  min={1}
                  max={999}
                />
              </div>
            </div>
          </div>
        )}

        {/* Only show the submit button if we have the required data */}
        {(activeTab === "shopping" ||
          (activeTab === "stock" &&
            formData.locationCategory &&
            formData.storageLocations.some(
              (loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0,
            ))) && (
          <Button
            onClick={(e) =>
              activeTab === "shopping" ? handleAddToShoppingList(e) : editingItem ? handleEditItem(e) : handleAddItem(e)
            }
            className="w-full min-h-[48px] text-base font-medium"
            disabled={
              !localName.trim() ||
              (activeTab === "stock" &&
                !formData.storageLocations.some(
                  (loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0,
                ))
            }
          >
            {activeTab === "shopping" ? "Add to Shopping List" : editingItem ? "Update Item" : "Add Item"}
          </Button>
        )}
      </div>
    )
  },
)

FormDialogContent.displayName = "FormDialogContent"