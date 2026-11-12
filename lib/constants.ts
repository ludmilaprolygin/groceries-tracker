/** An item is "running low" when its total quantity is at or below this value. */
export const LOW_STOCK_THRESHOLD = 3

/**
 * Muted, earthy swatches used for categories and members.
 * Values are stored in the database as Tailwind classes, so they must stay literal here.
 */
export const NEUTRAL_SWATCHES = [
  "bg-stone-400",
  "bg-stone-600",
  "bg-stone-800",
  "bg-zinc-500",
  "bg-amber-700",
  "bg-orange-800",
  "bg-yellow-700",
  "bg-lime-800",
  "bg-emerald-800",
  "bg-teal-700",
  "bg-sky-800",
  "bg-rose-800",
]

export const CATEGORY_ICONS = [
  "🥛", "🥩", "🍎", "🥕", "🍝", "🍞", "🍿", "🥤",
  "🧽", "🧴", "🧊", "🥫", "🍕", "🥗", "🍰", "🧀",
  "🥚", "🐟", "🍌", "🥒", "🍚", "🥖", "🍪", "☕",
  "🧻", "🧼", "❄️", "🥄", "📦", "🏷️", "🛒", "✨",
]
