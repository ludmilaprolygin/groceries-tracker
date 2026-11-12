"use client"

import { useState } from "react"
import { ExternalLink, Loader2, ShoppingCart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
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

  const match = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch("/api/masonline/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ items: items.map(({ id, name, quantity }) => ({ id, name, quantity })) }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Error ${res.status}`)
      const { results } = (await res.json()) as { results: MatchResult[] }
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

        {!loading && !error && results.length > 0 && (
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
                <a href={cartUrl} target="_blank" rel="noopener noreferrer" onClick={rememberChoices}>
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
