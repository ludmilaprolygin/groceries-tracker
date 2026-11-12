"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LAVADERO_LAYOUT, getLocationsForArea, type GridLocation, type LocationType } from "@/lib/locations"
import { cn } from "@/lib/utils"

interface LocationGridProps {
  selectedLocations: string[]
  onLocationSelect: (locationId: string) => void
  onLocationDeselect: (locationId: string) => void
  showQuantities?: boolean
  locationQuantities?: Record<string, number>
  locationType?: "lavadero" | "cocina" | "all"
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

  const renderCell = (location: GridLocation, shapeClassName: string) => {
    const selected = selectedLocations.includes(location.id)
    return (
      <Button
        type="button"
        variant="outline"
        aria-pressed={selected}
        className={cn(
          shapeClassName,
          "relative flex cursor-pointer touch-manipulation flex-col items-center justify-center gap-0.5 whitespace-normal p-1 text-xs font-medium transition-all duration-200",
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground"
            : "border-border bg-white text-neutral-900 hover:border-foreground/30 hover:bg-neutral-100 hover:text-neutral-900",
        )}
        onClick={() => toggle(location)}
      >
        <div className="text-base leading-none md:text-lg">{TYPE_ICONS[location.type]}</div>
        <div className="text-center text-[11px] leading-tight md:text-xs">{location.name}</div>
        {showQuantities && locationQuantities[location.id] && (
          <Badge
            variant="secondary"
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center text-xs"
          >
            {locationQuantities[location.id]}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl">{TITLES[locationType]}</h3>
        <p className="text-sm text-muted-foreground">Tocá los lugares donde guardás este item</p>
      </div>

      <div className="flex justify-center">
        {locationType === "lavadero" ? (
          <div
            className="grid h-[26rem] w-full max-w-sm overflow-hidden rounded-xl border-2 border-border bg-muted/40 md:h-[30rem]"
            style={{ gridTemplateColumns: LAVADERO_LAYOUT.columns, gridTemplateRows: LAVADERO_LAYOUT.rows }}
          >
            {LAVADERO_LAYOUT.blocks.map((block) => (
              <div
                key={block.area}
                style={{ gridArea: block.area }}
                className={cn(
                  "flex min-h-0 flex-col divide-y divide-border overflow-hidden",
                  block.framed && "border-2 border-border",
                  block.edges?.right && "border-r-2 border-border",
                  block.edges?.bottom && "border-b-2 border-border",
                )}
              >
                {block.sections.map((section, sectionIndex) => {
                  const location = section.id ? locations.find((loc) => loc.id === section.id) : undefined
                  return (
                    <div key={sectionIndex} className="relative min-h-0" style={{ flex: `${section.size} 1 0%` }}>
                      {location
                        ? renderCell(location, "h-full w-full rounded-none border-0 shadow-none")
                        : section.emoji && (
                            <div
                              aria-hidden
                              className="flex h-full w-full select-none items-center justify-center text-2xl opacity-60 md:text-3xl"
                            >
                              {section.emoji}
                            </div>
                          )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 md:p-4"
            style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
          >
            {grid.map((row, rowIndex) =>
              row.map((location, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} className="relative">
                  {location ? renderCell(location, cn(CELL_SIZE, "rounded-md border")) : <div className={CELL_SIZE} />}
                </div>
              )),
            )}
          </div>
        )}
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
