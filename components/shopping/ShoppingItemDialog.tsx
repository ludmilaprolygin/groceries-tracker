"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useData } from "@/components/providers/DataProvider"
import { ShoppingItemForm, type ShoppingItemValues } from "@/components/shopping/ShoppingItemForm"
import { today } from "@/lib/grocery"
import { preserveScrollPosition } from "@/lib/utils"

/** "Add to shopping list" button and its dialog. */
export function ShoppingItemDialog() {
  const { createShoppingItem } = useData()
  const [open, setOpen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) preserveScrollPosition()
    setOpen(next)
  }

  const handleSubmit = async ({ name, quantity }: ShoppingItemValues) => {
    await createShoppingItem({ name, quantity, location: "Shopping List", isCompleted: false, addedDate: today() })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10">
          <Plus />
          <span className="hidden sm:inline">Agregar a la lista de compras</span>
          <span className="sm:hidden">Agregar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar a la lista de compras</DialogTitle>
        </DialogHeader>
        <ShoppingItemForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
