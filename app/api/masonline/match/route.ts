import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod/v4"
import {
  MASONLINE_STORE,
  getProductBySku,
  itemKey,
  searchProducts,
  type MatchResult,
  type StoreProduct,
} from "@/lib/masonline"

export const maxDuration = 60

const MAX_ITEMS = 40
const SEARCH_CONCURRENCY = 6

const RequestSchema = z.object({
  items: z
    .array(z.object({ id: z.string(), name: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1)
    .max(MAX_ITEMS),
})

const PicksSchema = z.object({
  picks: z.array(
    z.object({
      itemId: z.string(),
      sku: z.string().nullable().describe("SKU of the chosen candidate, or null if none is a reasonable match"),
    }),
  ),
})

const SYSTEM_PROMPT = `You fill an online supermarket cart (MasOnline, Argentina) from a household shopping list.

For each list item you get the store's search results. Pick the candidate that best matches what the household most likely means:
- The product must be the thing on the list, not something that merely contains the word (for "leche", milk — not chocolate con leche or a milk frother).
- When the list item is generic, prefer the standard everyday version and a common size over specialty variants (protein, zero lactose, flavoured) unless the item asks for them.
- If the household's previous choices show a preferred brand or variant for similar products, follow it.
- Among equivalent options, prefer the lower price.
- Return null when no candidate is a reasonable match.

Return exactly one pick per list item, using the item's id.`

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
  const candidates = await searchProducts(item.name).catch(() => [])
  if (!saved) return { candidates }
  const remembered = candidates.find((c) => c.sku === saved.sku) ?? (await getProductBySku(saved.sku).catch(() => null))
  if (!remembered) return { candidates }
  return { candidates: [remembered, ...candidates.filter((c) => c.sku !== remembered.sku)], remembered }
}

/** Asks Claude to pick one candidate per item. Returns itemId → sku (or null). */
async function pickWithClaude(
  pending: { item: Item; candidates: StoreProduct[] }[],
  history: Choice[],
): Promise<Map<string, string | null>> {
  const client = new Anthropic()
  const input = {
    previous_household_choices: history.map((c) => ({ list_item: c.item_key, product: c.product_name })),
    items: pending.map(({ item, candidates }) => ({
      id: item.id,
      list_item: item.name,
      quantity: item.quantity,
      candidates: candidates.map((c) => ({ sku: c.sku, name: c.name, brand: c.brand, price_ars: c.price })),
    })),
  }

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(PicksSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(input) }],
  })

  const picks = new Map<string, string | null>()
  if (response.stop_reason === "refusal" || !response.parsed_output) return picks
  for (const { itemId, sku } of response.parsed_output.picks) picks.set(itemId, sku)
  return picks
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
    .limit(100)
  const history: Choice[] = choices ?? []
  const savedByKey = new Map(history.map((c) => [c.item_key, c]))

  const found = await mapLimited(items, SEARCH_CONCURRENCY, (item) => findCandidates(item, savedByKey.get(itemKey(item.name))))

  const results: MatchResult[] = items.map((item, i) => {
    const { candidates, remembered } = found[i]
    return {
      itemId: item.id,
      name: item.name,
      quantity: item.quantity,
      candidates,
      selectedSku: remembered?.sku ?? null,
      source: remembered ? "memory" : "none",
    }
  })

  const pending = results
    .map((result, i) => ({ result, item: items[i] }))
    .filter(({ result }) => result.source === "none" && result.candidates.length > 0)

  if (pending.length > 0) {
    let picks: Map<string, string | null> | null = null
    try {
      picks = await pickWithClaude(
        pending.map(({ item, result }) => ({ item, candidates: result.candidates })),
        history,
      )
    } catch (error) {
      console.error("Claude product matching failed:", error)
    }

    for (const { result } of pending) {
      if (!picks) {
        // AI unavailable: fall back to MasOnline's top result so the cart still works.
        result.selectedSku = result.candidates[0].sku
        result.source = "search"
        continue
      }
      const sku = picks.get(result.itemId)
      if (sku && result.candidates.some((c) => c.sku === sku)) {
        result.selectedSku = sku
        result.source = "ai"
      }
    }
  }

  return Response.json({ results })
}
