"use client"

import type React from "react"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dot } from "@/components/shared/Dot"
import { FieldLabel } from "@/components/shared/FieldLabel"
import { CATEGORY_ICONS, NEUTRAL_SWATCHES } from "@/lib/constants"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface CategoryValues {
  name: string
  color: string
  icon: string
}

interface CategoryFormProps {
  /** Category being edited; omit to create a new one. */
  category?: Category | null
  onSubmit: (values: CategoryValues) => void | Promise<void>
}

export function CategoryForm({ category, onSubmit }: CategoryFormProps) {
  const [values, setValues] = useState<CategoryValues>({
    name: category?.name ?? "",
    color: category?.color ?? "bg-stone-400",
    icon: category?.icon ?? "📦",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.name.trim()) return
    onSubmit({ ...values, name: values.name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 pt-2">
      {/* Preview */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/70 text-xl ring-1 ring-border">
          {values.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{values.name || "Nombre de la categoría"}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dot color={values.color} /> Vista previa
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="category-name">Nombre</FieldLabel>
        <Input
          id="category-name"
          value={values.name}
          onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ej.: Lácteos, Verdulería, Limpieza"
          className="h-11 text-base"
          autoFocus
        />
      </div>

      <div className="grid gap-2.5">
        <FieldLabel>Color</FieldLabel>
        <div className="flex flex-wrap gap-2.5">
          {NEUTRAL_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={values.color === color}
              onClick={() => setValues((prev) => ({ ...prev, color }))}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md ring-offset-2 ring-offset-background transition-all",
                color,
                values.color === color ? "ring-2 ring-foreground" : "hover:scale-110",
              )}
            >
              {values.color === color && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5">
        <FieldLabel>Ícono</FieldLabel>
        <div className="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border glass-control p-2">
          {CATEGORY_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              aria-pressed={values.icon === icon}
              onClick={() => setValues((prev) => ({ ...prev, icon }))}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-lg transition-colors",
                values.icon === icon ? "bg-secondary ring-1 ring-foreground/40" : "hover:bg-accent",
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="h-12 w-full text-[15px]" disabled={!values.name.trim()}>
        {category ? "Guardar cambios" : "Crear categoría"}
      </Button>
    </form>
  )
}
