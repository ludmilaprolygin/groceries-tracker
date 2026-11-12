"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth/AuthGuard"
import { useData } from "@/components/providers/DataProvider"
import { StockItemForm, type StockItemValues } from "@/components/stock/StockItemForm"
import type { GroceryItem } from "@/lib/types"
import { preserveScrollPosition } from "@/lib/utils"

interface StockItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Item being edited; null to create a new one. */
  item: GroceryItem | null
}

export function StockItemDialog({ open, onOpenChange, item }: StockItemDialogProps) {
  const { user } = useAuth()
  const { users, categories, createGroceryItem, updateGroceryItem } = useData()

  const handleOpenChange = (next: boolean) => {
    if (!next) preserveScrollPosition()
    onOpenChange(next)
  }

  const handleSubmit = async (values: StockItemValues) => {
    if (item) {
      await updateGroceryItem(item.id, values)
    } else {
      await createGroceryItem({
        ...values,
        allowedUsers: values.allowedUsers.length > 0 ? values.allowedUsers : [user.id],
      })
    }
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Nuevo item"}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form starts fresh for every item; it also unmounts when the dialog closes */}
        <StockItemForm
          key={item?.id ?? "new"}
          item={item}
          users={users}
          categories={categories}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
