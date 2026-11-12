"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Tag, Check } from "lucide-react"
import { Dot, EmptyState, FieldLabel, NEUTRAL_SWATCHES, SectionHeader } from "@/components/Primitives"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type { Category } from "@/hooks/useDatabase"

interface CategoryManagerProps {
  categories: Category[]
  onCreateCategory: (categoryData: Omit<Category, "id" | "created_at" | "updated_at">) => Promise<Category>
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<Category>
  onDeleteCategory: (id: string) => Promise<void>
}

const CATEGORY_COLORS = NEUTRAL_SWATCHES

const CATEGORY_ICONS = [
  "🥛",
  "🥩",
  "🍎",
  "🥕",
  "🍝",
  "🍞",
  "🍿",
  "🥤",
  "🧽",
  "🧴",
  "🧊",
  "🥫",
  "🍕",
  "🥗",
  "🍰",
  "🧀",
  "🥚",
  "🐟",
  "🍌",
  "🥒",
  "🍚",
  "🥖",
  "🍪",
  "☕",
  "🧻",
  "🧼",
  "❄️",
  "🥄",
  "📦",
  "🏷️",
  "🛒",
  "✨",
]

export function CategoryManager({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "bg-stone-400",
    icon: "📦",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      color: "bg-stone-400",
      icon: "📦",
    })
    setEditingCategory(null)
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Falta el nombre",
        description: "Ingresá un nombre para la categoría.",
        variant: "destructive",
      })
      return
    }

    try {
      await onCreateCategory(formData)
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleEdit = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast({
        title: "Falta el nombre",
        description: "Ingresá un nombre para la categoría.",
        variant: "destructive",
      })
      return
    }

    try {
      await onUpdateCategory(editingCategory.id, formData)
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      // Error handled in hook
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (
      window.confirm(
        "¿Seguro que querés eliminar esta categoría? Los items que la usan van a quedar sin categoría.",
      )
    ) {
      try {
        await onDeleteCategory(categoryId)
      } catch (error) {
        // Error handled in hook
      }
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Organizar"
        title="Categorías"
        description={`${categories.length} ${categories.length === 1 ? "categoría" : "categorías"}`}
        action={
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              if (!open) resetForm()
              setIsCreateDialogOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button className="h-10">
                <Plus />
                <span className="hidden sm:inline">Nueva categoría</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 pt-2">
                {/* Preview */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/70 text-xl ring-1 ring-border">
                    {formData.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{formData.name || "Nombre de la categoría"}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Dot color={formData.color} /> Vista previa
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="category-name">Nombre</FieldLabel>
                  <Input
                    id="category-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej.: Lácteos, Verdulería, Limpieza"
                    className="h-11 text-base"
                    autoFocus
                  />
                </div>

                <div className="grid gap-2.5">
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-2.5">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        onClick={() => setFormData((prev) => ({ ...prev, color }))}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md ring-offset-2 ring-offset-background transition-all",
                          color,
                          formData.color === color ? "ring-2 ring-foreground" : "hover:scale-110",
                        )}
                      >
                        {formData.color === color && <Check className="h-3.5 w-3.5 text-white" />}
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
                        onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-md text-lg transition-colors",
                          formData.icon === icon ? "bg-secondary ring-1 ring-foreground/40" : "hover:bg-accent",
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={editingCategory ? handleEdit : handleCreate}
                  className="h-12 w-full text-[15px]"
                  disabled={!formData.name.trim()}
                >
                  {editingCategory ? "Guardar cambios" : "Crear categoría"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {categories.length === 0 ? (
        <div className="glass rounded-lg border-dashed">
          <EmptyState
            icon={<Tag className="h-5 w-5" />}
            title="Todavía no hay categorías"
            description="Creá categorías para agrupar y filtrar tus items."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group flex items-center gap-3 glass rounded-lg p-3 pr-2 transition-colors hover:bg-white/70"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-xl">
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{category.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Dot color={category.color} /> Categoría
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(category)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  aria-label={`Editar ${category.name}`}
                >
                  <Pencil className="!size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Eliminar ${category.name}`}
                >
                  <Trash2 className="!size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
