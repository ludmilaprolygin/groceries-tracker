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
        title: "Name Required",
        description: "Please enter a category name.",
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
        title: "Name Required",
        description: "Please enter a category name.",
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
        "Are you sure you want to delete this category? Items using this category will become uncategorized.",
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
        eyebrow="Organise"
        title="Categories"
        description={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
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
                <span className="hidden sm:inline">New category</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit category" : "New category"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 pt-2">
                {/* Preview */}
                <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-xl ring-1 ring-border">
                    {formData.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{formData.name || "Category name"}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Dot color={formData.color} /> Preview
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="category-name">Name</FieldLabel>
                  <Input
                    id="category-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Dairy, Produce, Cleaning"
                    className="h-11 text-base"
                    autoFocus
                  />
                </div>

                <div className="grid gap-2.5">
                  <FieldLabel>Colour</FieldLabel>
                  <div className="flex flex-wrap gap-2.5">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        onClick={() => setFormData((prev) => ({ ...prev, color }))}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-all",
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
                  <FieldLabel>Icon</FieldLabel>
                  <div className="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-2xl border bg-card p-2">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-xl text-lg transition-colors",
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
                  {editingCategory ? "Save changes" : "Create category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50">
          <EmptyState
            icon={<Tag className="h-5 w-5" />}
            title="No categories yet"
            description="Create categories to group and filter your items."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 pr-2 transition-shadow hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{category.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Dot color={category.color} /> Category
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(category)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="!size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${category.name}`}
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
