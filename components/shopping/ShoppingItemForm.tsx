"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/shared/FieldLabel"
import { QuantityAdjuster } from "@/components/shared/QuantityAdjuster"

export interface ShoppingItemValues {
  name: string
  quantity: number
}

export function ShoppingItemForm({ onSubmit }: { onSubmit: (values: ShoppingItemValues) => void | Promise<void> }) {
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), quantity })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-7 pt-2">
      <div className="grid gap-2">
        <FieldLabel htmlFor="shopping-item-name">Producto</FieldLabel>
        <Input
          id="shopping-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej.: Aceite de oliva, Leche, Pan"
          className="h-12 text-base"
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border glass-control py-2 pl-4 pr-2">
        <div>
          <p className="text-sm font-medium">Cantidad</p>
          <p className="text-xs text-muted-foreground">Va directo a tu lista</p>
        </div>
        <QuantityAdjuster value={quantity} onChange={setQuantity} min={1} max={999} />
      </div>

      <Button type="submit" className="h-12 w-full text-[15px]" disabled={!name.trim()}>
        Agregar a la lista
      </Button>
    </form>
  )
}
