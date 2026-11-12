// MasOnline (masonline.com.ar) runs on VTEX: product search is public, and a
// /checkout/cart/add link fills the cart of whoever opens it — no credentials needed.

export const MASONLINE_STORE = "masonline"
const BASE_URL = "https://www.masonline.com.ar"
const SALES_CHANNEL = "1"

export interface StoreProduct {
  sku: string
  name: string
  brand: string
  price: number
  listPrice: number
  seller: string
  image?: string
  url: string
}

export interface MatchResult {
  itemId: string
  name: string
  quantity: number
  candidates: StoreProduct[]
  selectedSku: string | null
  /** memory: chosen before by the household · match: best rule-based match · none: nothing suitable */
  source: "memory" | "match" | "none"
}

/** Normalized shopping-list name used as the key for remembered choices ("Leche  Entera" → "leche entera"). */
export function itemKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Link that adds every line to the MasOnline cart of the browser that opens it. */
export function buildCartUrl(lines: { sku: string; seller: string; quantity: number }[]): string {
  const params = new URLSearchParams()
  for (const line of lines) {
    params.append("sku", line.sku)
    params.append("qty", String(line.quantity))
    params.append("seller", line.seller)
  }
  params.append("sc", SALES_CHANNEL)
  return `${BASE_URL}/checkout/cart/add?${params}`
}

// ---------- Server-side search ----------

/* eslint-disable @typescript-eslint/no-explicit-any -- VTEX responses are untyped JSON */
function toProducts(products: any[]): StoreProduct[] {
  const result: StoreProduct[] = []
  for (const product of products ?? []) {
    for (const item of product.items ?? []) {
      const seller = item.sellers?.find((s: any) => s.sellerDefault) ?? item.sellers?.[0]
      const offer = seller?.commertialOffer
      if (!offer || !offer.AvailableQuantity || !offer.Price) continue
      result.push({
        sku: String(item.itemId),
        name: item.nameComplete || product.productName,
        brand: product.brand ?? "",
        price: offer.Price,
        listPrice: offer.ListPrice ?? offer.Price,
        seller: String(seller.sellerId),
        image: item.images?.[0]?.imageUrl,
        url: `${BASE_URL}/${product.linkText}/p`,
      })
    }
  }
  return result
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function getJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" })
  if (!res.ok) throw new Error(`MasOnline ${res.status} for ${url}`)
  return res.json()
}

async function intelligentSearch(query: string, count: number, operator: "and" | "or"): Promise<StoreProduct[]> {
  const params = new URLSearchParams({ query, count: String(count), operator, locale: "es-AR", hideUnavailableItems: "true" })
  const data = await getJson(`${BASE_URL}/api/io/_v/api/intelligent-search/product_search/?${params}`)
  return toProducts(data.products)
}

/** "huevos blancos" → "huevo blanco": MasOnline returns nothing for some plurals. */
const singularize = (query: string) =>
  query
    .split(/\s+/)
    .map((w) => (w.length > 3 && /[aeiou]s$/i.test(w) ? w.slice(0, -1) : w))
    .join(" ")

/**
 * Available products for a free-text query, in MasOnline's relevance order.
 * Its search is strict (every word must match, some plurals return nothing), so when it finds
 * little it retries in singular and then with any of the words, leaving the ranking to the caller.
 */
export async function searchProducts(query: string, count = 8): Promise<StoreProduct[]> {
  const MIN_RESULTS = 3
  const attempts: [string, "and" | "or"][] = [
    [query, "and"],
    [singularize(query), "and"],
    [query, "or"],
  ]
  const results: StoreProduct[] = []
  const tried = new Set<string>()
  for (const [q, operator] of attempts) {
    if (tried.has(`${q}|${operator}`)) continue
    tried.add(`${q}|${operator}`)
    for (const product of await intelligentSearch(q, count, operator)) {
      if (!results.some((p) => p.sku === product.sku)) results.push(product)
    }
    if (results.length >= MIN_RESULTS) break
  }
  return results.slice(0, count)
}

/** A single SKU, or null if it no longer exists or is out of stock. */
export async function getProductBySku(sku: string): Promise<StoreProduct | null> {
  const data = await getJson(`${BASE_URL}/api/catalog_system/pub/products/search?fq=skuId:${encodeURIComponent(sku)}`)
  return toProducts(data).find((p) => p.sku === sku) ?? null
}
