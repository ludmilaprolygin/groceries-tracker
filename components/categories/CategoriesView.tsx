"use client"

import { useState } from "react"
import { Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryCard } from "@/components/categories/CategoryCard"
import { CategoryDialog } from "@/components/categories/CategoryDialog"
import { useData } from "@/components/providers/DataProvider"
import { EmptyState } from "@/components/shared/EmptyState"
import { SectionHeader } from "@/components/shared/SectionHeader"
import type { Category } from "@/lib/types"

export function CategoriesView() {
  const { categories, deleteCategory } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const openDialog = (category: Category | null) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm("¿Seguro que querés eliminar esta categoría? Los items que la usan van a quedar sin categoría.")) {
      return
    }
    try {
      await deleteCategory(category.id)
    } catch {
      // Error already reported by the hook
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Organizar"
        title="Categorías"
        description={`${categories.length} ${categories.length === 1 ? "categoría" : "categorías"}`}
        action={
          <Button onClick={() => openDialog(null)} className="h-10">
            <Plus />
            <span className="hidden sm:inline">Nueva categoría</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
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
            <CategoryCard key={category.id} category={category} onEdit={openDialog} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editingCategory} />
    </div>
  )
}
