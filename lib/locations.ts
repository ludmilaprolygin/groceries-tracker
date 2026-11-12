export type LocationType = "cabinet" | "tool" | "shelf1" | "shelf2" | "appliance"

export interface GridLocation {
  id: string
  name: string
  row: number
  col: number
  type: LocationType
}

/** Storage areas the user can pick from when adding an item. */
export type StorageArea = "lavadero" | "cocina" | "otros"

export const STORAGE_AREAS: { id: StorageArea; label: string; icon: string }[] = [
  { id: "lavadero", label: "Lavadero", icon: "🧺" },
  { id: "cocina", label: "Cocina", icon: "🍳" },
  { id: "otros", label: "Otros", icon: "📦" },
]

export const LAVADERO_LOCATIONS: GridLocation[] = [
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

export const COCINA_LOCATIONS: GridLocation[] = [
  { id: "cocina-1", name: "Cocina 1", row: 0, col: 0, type: "cabinet" },
  { id: "cocina-2", name: "Cocina 2", row: 0, col: 1, type: "cabinet" },
  { id: "cocina-3", name: "Cocina 3", row: 1, col: 0, type: "cabinet" },
  { id: "cocina-4", name: "Cocina 4", row: 1, col: 1, type: "cabinet" },
]

export const ALL_LOCATIONS: GridLocation[] = [...LAVADERO_LOCATIONS, ...COCINA_LOCATIONS]

export function getLocationsForArea(area: "lavadero" | "cocina" | "all"): GridLocation[] {
  if (area === "lavadero") return LAVADERO_LOCATIONS
  if (area === "cocina") return COCINA_LOCATIONS
  return ALL_LOCATIONS
}
