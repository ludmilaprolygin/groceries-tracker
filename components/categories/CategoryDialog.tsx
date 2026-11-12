"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useData } from "@/components/providers/DataProvider"
import { CategoryForm, type CategoryValues } from "@/components/categories/CategoryForm"
import type { Category } from "@/lib/types"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Category being edited; null to create a new one. */
  category: Category | null
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const { createCategory, updateCategory } = useData()

  const handleSubmit = async (values: CategoryValues) => {
    try {
      if (category) {
        await updateCategory(category.id, values)
      } else {
        await createCategory(values)
      }
      onOpenChange(false)
    } catch {
      // Error already reported by the hook; keep the dialog open
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        </DialogHeader>
        <CategoryForm key={category?.id ?? "new"} category={category} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
