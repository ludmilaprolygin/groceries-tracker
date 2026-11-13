"use client"

import { useState } from "react"
import { ArrowLeft, CheckCheck, ExternalLink, Loader2, ShoppingCart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { usePurchaseToStock } from "@/hooks/usePurchaseToStock"
import { MASONLINE_STORE, buildCartUrl, itemKey, type MatchResult, type StoreProduct } from "@/lib/masonline"
import { supabase } from "@/lib/supabase"
import type { ShoppingItem } from "@/lib/types"
import { preserveScrollPosition } from "@/lib/utils"

const NONE = "none"
const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)

const SOURCE_LABEL: Record<MatchResult["source"], string | null> = {
  memory: "Elegido antes",
  match: "Sugerido",
  none: null,
}

/** The match API takes at most 40 items and has 30 s per call, so long lists go in smaller batches. */
const BATCH_SIZE = 20
const PARALLEL_BATCHES = 2

async function matchBatch(batch: ShoppingItem[], accessToken: string): Promise<MatchResult[]> {
  const res = await fetch("/api/masonline/match", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ items: batch.map(({ id, name, quantity }) => ({ id, name, quantity })) }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Error ${res.status}`)
  return ((await res.json()) as { results: MatchResult[] }).results
}

interface MasOnlineCartDialogProps {
  items: ShoppingItem[]
}

/** Matches the pending shopping list against MasOnline and opens a pre-filled cart there. */
export function MasOnlineCartDialog({ items }: MasOnlineCartDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MatchResult[]>([])
  const [selection, setSelection] = useState<Record<string, string>>({})
  /** The MasOnline cart was opened: show the summary instead of the product pickers. */
  const [cartOpened, setCartOpened] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const { togglePurchased } = usePurchaseToStock()

  const match = async () => {
    setLoading(true)
    setError(null)
    setCartOpened(false)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ""
      const batches: ShoppingItem[][] = []
      for (let i = 0; i < items.length; i += BATCH_SIZE) batches.push(items.slice(i, i + BATCH_SIZE))

      const batchResults: MatchResult[][] = new Array(batches.length)
      let next = 0
      const worker = async () => {
        while (next < batches.length) {
          const i = next++
          batchResults[i] = await matchBatch(batches[i], token)
        }
      }
      await Promise.all(Array.from({ length: Math.min(PARALLEL_BATCHES, batches.length) }, worker))
      const results = batchResults.flat()
      setResults(results)
      setSelection(Object.fromEntries(results.map((r) => [r.itemId, r.selectedSku ?? NONE])))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo buscar en MasOnline")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) preserveScrollPosition()
    setOpen(next)
    if (next) match()
  }

  const chosen = results.flatMap((result) => {
    const product = result.candidates.find((c) => c.sku === selection[result.itemId])
    return product ? [{ result, product }] : []
  })
  const leftOut = results.filter((result) => !chosen.some((c) => c.result.itemId === result.itemId))
  const total = chosen.reduce((sum, { result, product }) => sum + product.price * result.quantity, 0)
  const cartUrl = buildCartUrl(chosen.map(({ result, product }) => ({ ...product, quantity: result.quantity })))

  const rememberChoices = async () => {
    const rows = chosen.map(({ result, product }) => ({
      store: MASONLINE_STORE,
      item_key: itemKey(result.name),
      sku: product.sku,
      product_name: product.name,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from("store_product_choices").upsert(rows)
    if (error) toast({ title: "No se pudieron guardar tus elecciones", variant: "destructive" })
  }

  const openCart = () => {
    setCartOpened(true)
    rememberChoices()
  }

  /** Marks what went to MasOnline as bought (adding it to the stock); the left-out items stay pending. */
  const discardBought = async () => {
    if (discarding) return
    setDiscarding(true)
    let done = 0
    try {
      // One at a time: entries can share a stock item, and each update builds on the previous one
      for (const { result } of chosen) {
        const entry = items.find((item) => item.id === result.itemId)
        if (entry && !entry.isCompleted && (await togglePurchased(entry, { silent: true }))) done++
      }
    } finally {
      setDiscarding(false)
    }
    toast({
      title: `${done} ${done === 1 ? "producto marcado" : "productos marcados"} como comprado${done === 1 ? "" : "s"}`,
      description: leftOut.length
        ? `${leftOut.length} ${leftOut.length === 1 ? "queda" : "quedan"} en la lista de compras.`
        : "Se sumaron al stock.",
    })
    if (done === chosen.length) handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="glass flex items-center justify-between gap-4 rounded-lg p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Armar el changuito en MasOnline</p>
          <p className="text-xs text-muted-foreground">Buscamos cada item y te dejamos el carrito listo.</p>
        </div>
        <Button onClick={() => handleOpenChange(true)} variant="outline" size="sm" className="shrink-0">
          <ShoppingCart /> Armar
        </Button>
      </div>

      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Changuito de MasOnline</DialogTitle>
          <DialogDescription>Revisá qué producto va por cada item antes de abrir el carrito.</DialogDescription>
        </DialogHeader>

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {loading ? (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-14 w-full" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={match}>
                Reintentar
              </Button>
            </div>
          ) : cartOpened ? (
            <CartSummary sent={chosen.length} leftOut={leftOut} />
          ) : (
            <ul className="divide-y divide-border/70">
              {results.map((result) => (
                <MatchRow
                  key={result.itemId}
                  result={result}
                  value={selection[result.itemId] ?? NONE}
                  onChange={(sku) => setSelection((prev) => ({ ...prev, [result.itemId]: sku }))}
                />
              ))}
            </ul>
          )}
        </div>

        {!loading && !error && cartOpened && (
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setCartOpened(false)} disabled={discarding}>
              <ArrowLeft /> Volver a elegir
            </Button>
            <Button onClick={discardBought} disabled={discarding || chosen.length === 0}>
              {discarding ? <Loader2 className="animate-spin" /> : <CheckCheck />} Descartar productos comprados
            </Button>
          </div>
        )}

        {!loading && !error && !cartOpened && results.length > 0 && (
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {chosen.length} de {results.length} items ·{" "}
              <span className="font-medium tabular-nums">{formatPrice(total)}</span>
              <span className="block text-xs text-muted-foreground">Precios de referencia; el carrito muestra el final.</span>
            </p>
            {chosen.length === 0 ? (
              <Button disabled>
                Abrir changuito <ExternalLink />
              </Button>
            ) : (
              <Button asChild>
                <a href={cartUrl} target="_blank" rel="noopener noreferrer" onClick={openCart}>
                  Abrir changuito <ExternalLink />
                </a>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MatchRow({ result, value, onChange }: { result: MatchResult; value: string; onChange: (sku: string) => void }) {
  const selected = result.candidates.find((c) => c.sku === value)
  const label = value === result.selectedSku ? SOURCE_LABEL[result.source] : null

  return (
    <li className="space-y-2 py-3">
      <div className="flex items-center gap-2">
        <p className="truncate text-[15px] font-medium">{result.name}</p>
        <span className="shrink-0 rounded-[4px] bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          ×{result.quantity}
        </span>
        {label && (
          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {result.source === "match" && <Sparkles className="h-3 w-3" />}
            {label}
          </span>
        )}
      </div>

      {result.candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No encontramos este producto en MasOnline.</p>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-auto min-h-14 py-2 text-left">
            <SelectValue>{selected ? <ProductLine product={selected} /> : "No agregar"}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            {result.candidates.map((product) => (
              <SelectItem key={product.sku} value={product.sku}>
                <ProductLine product={product} />
              </SelectItem>
            ))}
            <SelectItem value={NONE}>No agregar</SelectItem>
          </SelectContent>
        </Select>
      )}
    </li>
  )
}

function ProductLine({ product }: { product: StoreProduct }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote VTEX image, next/image is unoptimized anyway
        <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded bg-white object-contain" />
      ) : (
        <span className="h-10 w-10 shrink-0 rounded bg-secondary" />
      )}
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm">{product.name}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{formatPrice(product.price)}</span>
      </span>
    </span>
  )
}

function CartSummary({ sent, leftOut }: { sent: number; leftOut: MatchResult[] }) {
  return (
    <div className="space-y-4 py-2">
      <p className="text-sm">
        Mandaste <span className="font-medium">{sent}</span> {sent === 1 ? "producto" : "productos"} al changuito de
        MasOnline. Cuando termines la compra, descartalos de la lista: se marcan como comprados y se suman al stock.
      </p>

      {leftOut.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quedó nada afuera.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {leftOut.length === 1 ? "Queda 1 producto" : `Quedan ${leftOut.length} productos`} en la lista de compras
          </p>
          <ul className="divide-y divide-border/70 rounded-md border border-border/70">
            {leftOut.map((result) => (
              <li key={result.itemId} className="flex items-center gap-2 px-3 py-2">
                <span className="truncate text-sm">{result.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">×{result.quantity}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {result.candidates.length === 0 ? "No está en MasOnline" : "No agregado"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
