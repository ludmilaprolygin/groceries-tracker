import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import {
  MASONLINE_STORE,
  getProductBySku,
  itemKey,
  searchProducts,
  type MatchResult,
  type StoreProduct,
} from "@/lib/masonline"
import { brandsFromHistory, pickBestProduct } from "@/lib/productMatch"

export const maxDuration = 30

const MAX_ITEMS = 40
const SEARCH_CONCURRENCY = 6
const CANDIDATES_PER_ITEM = 10

const RequestSchema = z.object({
  items: z
    .array(z.object({ id: z.string(), name: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1)
    .max(MAX_ITEMS),
})

type Item = z.infer<typeof RequestSchema>["items"][number]
type Choice = { item_key: string; sku: string; product_name: string }

/** The caller must be a signed-in household member; RLS then applies to every query made with this client. */
async function getMemberClient(req: Request) {
  const authorization = req.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  )
  const { data: isMember, error } = await supabase.rpc("is_member")
  return !error && isMember ? supabase : null
}

async function mapLimited<T, R>(values: T[], limit: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(values.length)
  let next = 0
  const worker = async () => {
    while (next < values.length) {
      const i = next++
      results[i] = await fn(values[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker))
  return results
}

async function findCandidates(item: Item, saved?: Choice): Promise<{ candidates: StoreProduct[]; remembered?: StoreProduct }> {
  const candidates = await searchProducts(item.name, CANDIDATES_PER_ITEM).catch(() => [])
  if (!saved) return { candidates }
  const remembered = candidates.find((c) => c.sku === saved.sku) ?? (await getProductBySku(saved.sku).catch(() => null))
  if (!remembered) return { candidates }
  return { candidates: [remembered, ...candidates.filter((c) => c.sku !== remembered.sku)], remembered }
}

export async function POST(req: Request) {
  const supabase = await getMemberClient(req)
  if (!supabase) return Response.json({ error: "No autorizado" }, { status: 401 })

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Lista inválida" }, { status: 400 })
  const { items } = parsed.data

  const { data: choices } = await supabase
    .from("store_product_choices")
    .select("item_key, sku, product_name")
    .eq("store", MASONLINE_STORE)
    .order("updated_at", { ascending: false })
    .limit(200)
  const history: Choice[] = choices ?? []
  const savedByKey = new Map(history.map((c) => [c.item_key, c]))
  const savedNames = history.map((c) => c.product_name)

  const found = await mapLimited(items, SEARCH_CONCURRENCY, (item) => findCandidates(item, savedByKey.get(itemKey(item.name))))

  const results: MatchResult[] = items.map((item, i) => {
    const { candidates, remembered } = found[i]
    const base = { itemId: item.id, name: item.name, quantity: item.quantity, candidates }
    if (remembered) return { ...base, selectedSku: remembered.sku, source: "memory" }

    const best = pickBestProduct(item.name, candidates, brandsFromHistory(savedNames, candidates))
    return best ? { ...base, selectedSku: best.sku, source: "match" } : { ...base, selectedSku: null, source: "none" }
  })

  return Response.json({ results })
}
