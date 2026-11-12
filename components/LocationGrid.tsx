"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const LAVADERO_LOCATIONS = [
  // Parte superior (2x2) en la primera fila
  { id: "upper-1", name: "Reservas 1", row: 0, col: 0, type: "cabinet" },
  { id: "upper-2", name: "Reservas 2", row: 0, col: 2, type: "cabinet" },
  { id: "upper-3", name: "Diario 1", row: 1, col: 0, type: "cabinet" },
  { id: "upper-4", name: "Diario 2", row: 1, col: 2, type: "cabinet" },

  // Estantes en la columna central (4 estantes)
  { id: "estante-1", name: "Higiene", row: 2, col: 1, type: "shelf1" },
  { id: "estante-2", name: "Limpieza 1", row: 3, col: 1, type: "shelf1" },
  { id: "estante-3", name: "Limpieza 2", row: 4, col: 1, type: "shelf1" },
  { id: "estante-4", name: "Varios", row: 5, col: 1, type: "shelf1" },

  // Lavarropas y agujero encima (columna derecha)
  { id: "agujero-arriba-lavarropas", name: "Estante grande", row: 3, col: 2, type: "shelf2" },
  { id: "lavarropas", name: "Lavarropas", row: 4, col: 2, type: "appliance" },
]

const COCINA_LOCATIONS = [
  { id: "cocina-1", name: "Cocina 1", row: 0, col: 0, type: "cabinet" },
  { id: "cocina-2", name: "Cocina 2", row: 0, col: 1, type: "cabinet" },
  { id: "cocina-3", name: "Cocina 3", row: 1, col: 0, type: "cabinet" },
  { id: "cocina-4", name: "Cocina 4", row: 1, col: 1, type: "cabinet" },
]

// Keep the original as ALL_LOCATIONS for backward compatibility
const ALL_LOCATIONS = [...LAVADERO_LOCATIONS, ...COCINA_LOCATIONS]

interface LocationGridProps {
  selectedLocations: string[]
  onLocationSelect: (location: string) => void
  onLocationDeselect: (location: string) => void
  showQuantities?: boolean
  locationQuantities?: Record<string, number>
  locationType?: "lavadero" | "cocina" | "all"
}

export function LocationGrid({
  selectedLocations,
  onLocationSelect,
  onLocationDeselect,
  showQuantities = false,
  locationQuantities = {},
  locationType = "all",
}: LocationGridProps) {
  const getLocationsForType = () => {
    switch (locationType) {
      case "lavadero":
        return LAVADERO_LOCATIONS
      case "cocina":
        return COCINA_LOCATIONS
      default:
        return ALL_LOCATIONS
    }
  }

  const locations = getLocationsForType()

  const getLocationStyle = (type: string, isSelected: boolean) => {
    const baseStyle =
      "relative h-16 w-[5.25rem] md:h-20 md:w-28 p-1 text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center gap-0.5 touch-manipulation rounded-md border whitespace-normal cursor-pointer"

    // Subtle tonal differences per furniture type, all within the neutral palette
    const typeStyles: Record<string, string> = {
      cabinet: "glass-control",
      tool: "glass-control",
      shelf1: "bg-secondary/70",
      shelf2: "bg-secondary",
      appliance: "bg-muted",
    }

    return isSelected
      ? `${baseStyle} bg-primary text-primary-foreground border-primary shadow-md hover:bg-primary/90 hover:text-primary-foreground`
      : `${baseStyle} ${typeStyles[type] ?? "glass-control"} border-border text-foreground hover:border-foreground/30 hover:bg-accent`
  }

  const getLocationIcon = (type: string) => {
    const icons = {
      cabinet: "🧺",
      tool: "🧹",
      shelf1: "🗄️",
      shelf2: "🗄️",
      appliance: "🫧",
      pantry: "🥫",
      counter: "🍽️",
      fridge: "🧊",
      freezer: "🥶",
      drawer: "🗃️",
    }
    return icons[type as keyof typeof icons] || ""
  }

  const handleLocationClick = (location: (typeof LAVADERO_LOCATIONS)[0]) => {
    const isSelected = selectedLocations.includes(location.id)
    if (isSelected) {
      onLocationDeselect(location.id)
    } else {
      onLocationSelect(location.id)
    }
  }

  const gridRows = locationType === "cocina" ? 2 : 6
  const gridCols = locationType === "cocina" ? 2 : 3
  const grid = Array(gridRows)
    .fill(null)
    .map(() => Array(gridCols).fill(null))

  locations.forEach((location) => {
    if (location.row < gridRows && location.col < gridCols) {
      grid[location.row][location.col] = location
    }
  })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl">
          {locationType === "lavadero"
            ? "Lavadero Storage"
            : locationType === "cocina"
              ? "Cocina Storage"
              : "Kitchen Storage Layout"}
        </h3>
        <p className="text-sm text-muted-foreground">Tap the spots where you store this item</p>
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
                    className={getLocationStyle(location.type, selectedLocations.includes(location.id))}
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="text-base leading-none md:text-lg">{getLocationIcon(location.type)}</div>
                    <div className="text-center text-[11px] leading-tight md:text-xs">{location.name}</div>
                    {showQuantities && locationQuantities[location.id] && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs"
                      >
                        {locationQuantities[location.id]}
                      </Badge>
                    )}
                  </Button>
                ) : (
                  <div className="h-16 w-[5.25rem] md:h-20 md:w-28" />
                )}
              </div>
            )),
          )}
        </div>
      </div>

      {selectedLocations.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Selected:</span> {selectedLocations.map((id) => locations.find((loc) => loc.id === id)?.name).join(", ")}
          </p>
        </div>
      )}
    </div>
  )
}

export { ALL_LOCATIONS as KITCHEN_LOCATIONS, LAVADERO_LOCATIONS, COCINA_LOCATIONS }
