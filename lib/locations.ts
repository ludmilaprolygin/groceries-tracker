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

  // Agujero encima del lavarropas (columna derecha)
  { id: "agujero-arriba-lavarropas", name: "Estante grande", row: 3, col: 2, type: "shelf2" },
]

export interface LayoutSection {
  /** Location id, or `null` for an empty space (no button). */
  id: string | null
  /** Relative height within its block. */
  size: number
  /** Decorative emoji shown in empty (non-selectable) sections. */
  emoji?: string
}

export interface LayoutBlock {
  /** CSS `grid-area` (row-start / col-start / row-end / col-end). */
  area: string
  sections: LayoutSection[]
  /** Drawn as its own piece of furniture (bordered). */
  framed?: boolean
  /** Divider lines drawn on the block's edges. */
  edges?: { right?: boolean; bottom?: boolean }
}

/**
 * Visual layout of the lavadero furniture, as a 3-column CSS grid:
 * two cabinets across the top, then an empty space, the shelf unit
 * and the big shelf above the washing machine.
 */
export const LAVADERO_LAYOUT: { columns: string; rows: string; blocks: LayoutBlock[] } = {
  columns: "19fr 17fr 35fr",
  rows: "5fr 10fr",
  blocks: [
    {
      area: "1 / 1 / 2 / 3",
      sections: [
        { id: "upper-1", size: 1 },
        { id: "upper-3", size: 1 },
      ],
      edges: { right: true, bottom: true },
    },
    {
      area: "1 / 3 / 2 / 4",
      sections: [
        { id: "upper-2", size: 1 },
        { id: "upper-4", size: 1 },
      ],
      edges: { bottom: true },
    },
    {
      area: "2 / 1 / 3 / 2",
      sections: [{ id: null, size: 1, emoji: "🧹" }],
    },
    {
      area: "2 / 2 / 3 / 3",
      framed: true,
      sections: [
        { id: "estante-1", size: 1 },
        { id: "estante-2", size: 1 },
        { id: "estante-3", size: 1 },
        { id: "estante-4", size: 1 },
      ],
    },
    {
      area: "2 / 3 / 3 / 4",
      sections: [
        { id: "agujero-arriba-lavarropas", size: 2 },
        { id: null, size: 2.7, emoji: "🫧" }, // Lavarropas
      ],
    },
  ],
}

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
