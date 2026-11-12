"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getLocationsForArea, type GridLocation, type LocationType } from "@/lib/locations"
import { cn } from "@/lib/utils"

interface LocationGridProps {
  selectedLocations: string[]
  onLocationSelect: (locationId: string) => void
  onLocationDeselect: (locationId: string) => void
  showQuantities?: boolean
  locationQuantities?: Record<string, number>
  locationType?: "lavadero" | "cocina" | "all"
}

// Subtle tonal differences per furniture type, all within the neutral palette
const TYPE_STYLES: Record<LocationType, string> = {
  cabinet: "glass-control",
  tool: "glass-control",
  shelf1: "bg-secondary/70",
  shelf2: "bg-secondary",
  appliance: "bg-muted",
}

const TYPE_ICONS: Record<LocationType, string> = {
  cabinet: "🧺",
  tool: "🧹",
  shelf1: "🗄️",
  shelf2: "🗄️",
  appliance: "🫧",
}

const TITLES = { lavadero: "Lavadero", cocina: "Cocina", all: "Ubicaciones" }

const CELL_SIZE = "h-16 w-[5.25rem] md:h-20 md:w-28"

/** Visual map of the furniture in an area; tap cells to toggle where an item is stored. */
export function LocationGrid({
  selectedLocations,
  onLocationSelect,
  onLocationDeselect,
  showQuantities = false,
  locationQuantities = {},
  locationType = "all",
}: LocationGridProps) {
  const locations = getLocationsForArea(locationType)

  const gridRows = locationType === "cocina" ? 2 : 6
  const gridCols = locationType === "cocina" ? 2 : 3
  const grid: (GridLocation | null)[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(null))
  for (const location of locations) {
    if (location.row < gridRows && location.col < gridCols) {
      grid[location.row][location.col] = location
    }
  }

  const toggle = (location: GridLocation) =>
    selectedLocations.includes(location.id) ? onLocationDeselect(location.id) : onLocationSelect(location.id)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl">{TITLES[locationType]}</h3>
        <p className="text-sm text-muted-foreground">Tocá los lugares donde guardás este item</p>
      </div>

      <div className="flex justify-center">
        <div
          className="grid gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 md:p-4"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {grid.map((row, rowIndex) =>
            row.map((location, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="relative">
                {location ? (
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={selectedLocations.includes(location.id)}
                    className={cn(
                      CELL_SIZE,
                      "relative flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-0.5 whitespace-normal rounded-md border p-1 text-xs font-medium transition-all duration-200",
                      selectedLocations.includes(location.id)
                        ? "border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                        : cn(TYPE_STYLES[location.type], "border-border text-foreground hover:border-foreground/30 hover:bg-accent"),
                    )}
                    onClick={() => toggle(location)}
                  >
                    <div className="text-base leading-none md:text-lg">{TYPE_ICONS[location.type]}</div>
                    <div className="text-center text-[11px] leading-tight md:text-xs">{location.name}</div>
                    {showQuantities && locationQuantities[location.id] && (
                      <Badge
                        variant="secondary"
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center text-xs"
                      >
                        {locationQuantities[location.id]}
                      </Badge>
                    )}
                  </Button>
                ) : (
                  <div className={CELL_SIZE} />
                )}
              </div>
            )),
          )}
        </div>
      </div>

      {selectedLocations.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Seleccionado:</span>{" "}
          {selectedLocations.map((id) => locations.find((loc) => loc.id === id)?.name).join(", ")}
        </p>
      )}
    </div>
  )
}
