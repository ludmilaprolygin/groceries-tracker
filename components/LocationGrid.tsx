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
      "relative h-12 w-20 md:h-16 md:w-24 text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center min-h-[48px] touch-manipulation rounded-2xl"

    const typeStyles = {
      cabinet: isSelected ? "bg-blue-500 text-white border-blue-600" : "bg-blue-50 hover:bg-blue-100 border-blue-200",
      tool: isSelected ? "bg-green-500 text-white border-green-600" : "bg-green-50 hover:bg-green-100 border-green-200",
      shelf1: isSelected
        ? "bg-orange-500 text-white border-orange-600"
        : "bg-orange-50 hover:bg-orange-100 border-orange-200",
      appliance: isSelected
        ? "bg-purple-500 text-white border-purple-600"
        : "bg-purple-50 hover:bg-purple-100 border-purple-200",
      shelf2: isSelected ? "bg-red-500 text-white border-red-600" : "bg-red-50 hover:bg-red-100 border-red-200",
    }

    return `${baseStyle} ${typeStyles[type as keyof typeof typeStyles]} border-2 cursor-pointer`
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
      drawer: " drawers ",
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
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {locationType === "lavadero"
            ? "Lavadero Storage"
            : locationType === "cocina"
              ? "Cocina Storage"
              : "Kitchen Storage Layout"}
        </h3>
        <p className="text-sm text-muted-foreground">Click on storage locations to select them</p>
      </div>

      <div className="flex justify-center">
        <div
          className="grid gap-2 p-4 bg-muted/20 rounded-lg border-2 border-dashed"
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
                    <div className="text-sm md:text-lg mb-1">{getLocationIcon(location.type)}</div>
                    <div className="text-center leading-tight text-xs md:text-xs">{location.name}</div>
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
                  <div className="h-12 w-20 md:h-16 md:w-24" />
                )}
              </div>
            )),
          )}
        </div>
      </div>

      {selectedLocations.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Selected: {selectedLocations.map((id) => locations.find((loc) => loc.id === id)?.name).join(", ")}
          </p>
        </div>
      )}
    </div>
  )
}

export { ALL_LOCATIONS as KITCHEN_LOCATIONS, LAVADERO_LOCATIONS, COCINA_LOCATIONS }
