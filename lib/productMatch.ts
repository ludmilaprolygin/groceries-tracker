import { itemKey, type StoreProduct } from "@/lib/masonline"

// Picks the store product that best matches a generic shopping-list name ("leche", "yerba")
// with simple rules, so no paid AI is needed. Remembered choices take priority over this.

/** Word prefixes that mark a specialty variant: only acceptable when the list item asks for them. */
const VARIANT_PREFIXES = [
  "protein", "zero", "deslactosad", "lactosa", "light", "diet", "saborizad",
  "chocolat", "frutilla", "vainilla", "durazno", "mini", "kids", "infantil", "bebe", "organic",
]

/** Connectors ignored when comparing names. */
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "sin", "y", "en", "para", "x"])

/** Below this the product only mentions the item ("Jugo de Limón" for "limones"): better to let the user pick. */
const MIN_SCORE = 3

const tokens = (text: string) =>
  itemKey(text)
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t && !STOPWORDS.has(t))

/** Same word ignoring Spanish plurals: "huevo"/"huevos", "limon"/"limones". */
const sameWord = (a: string, b: string) => a === b || a === `${b}s` || b === `${a}s` || a === `${b}es` || b === `${a}es`

export function scoreProduct(query: string, product: StoreProduct, preferredBrands: Set<string>, rank: number): number {
  const wanted = tokens(query)
  const name = tokens(product.name)
  let score = 0

  // Every word of the list item should be in the product name.
  for (const word of wanted) score += name.some((n) => sameWord(n, word)) ? 3 : -4

  // The product should *be* the item, not merely contain it: "Leche Entera…" beats "Chocolate con Leche…".
  const firstHit = name.findIndex((n) => sameWord(n, wanted[0] ?? ""))
  if (firstHit === 0) score += 4
  else if (firstHit > 0) score -= Math.min(firstHit, 4)

  for (const word of name) {
    const variant = VARIANT_PREFIXES.find((prefix) => word.startsWith(prefix))
    if (variant && !wanted.some((w) => w.startsWith(variant))) score -= 3
  }

  if (product.brand && preferredBrands.has(itemKey(product.brand))) score += 3

  // Ties go to the store's own relevance order.
  return score - rank * 0.1
}

/** Brands of products the household picked before, matched against their saved product names. */
export function brandsFromHistory(productNames: string[], candidates: StoreProduct[]): Set<string> {
  const history = productNames.map(itemKey)
  const brands = new Set<string>()
  for (const { brand } of candidates) {
    const key = itemKey(brand ?? "")
    if (key && history.some((name) => name.includes(key))) brands.add(key)
  }
  return brands
}

/** Best candidate for the list item, or null when nothing is a reasonable match. */
export function pickBestProduct(
  query: string,
  candidates: StoreProduct[],
  preferredBrands: Set<string>,
): StoreProduct | null {
  let best: StoreProduct | null = null
  let bestScore = -Infinity
  candidates.forEach((product, rank) => {
    const score = scoreProduct(query, product, preferredBrands, rank)
    if (score > bestScore) {
      best = product
      bestScore = score
    }
  })
  return bestScore >= MIN_SCORE ? best : null
}
