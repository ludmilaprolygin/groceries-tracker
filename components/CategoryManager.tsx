"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, Tag } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Category } from "@/hooks/useDatabase"

interface CategoryManagerProps {
  categories: Category[]
  onCreateCategory: (categoryData: Omit<Category, "id" | "created_at" | "updated_at">) => Promise<Category>
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<Category>
  onDeleteCategory: (id: string) => Promise<void>
}

const CATEGORY_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
]

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
    color: "bg-gray-500",
    icon: "📦",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      color: "bg-gray-500",
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
    <Card>
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Tag className="h-4 w-4 md:h-5 md:w-5" />
            Categories
          </CardTitle>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              if (!open) resetForm()
              setIsCreateDialogOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="min-h-[44px] md:min-h-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Dairy, Meat, Fruits"
                    className="text-base"
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full ${color} border-2 ${
                          formData.color === color ? "border-foreground" : "border-transparent"
                        } hover:scale-110 transition-transform`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Icon</Label>
                  <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                        className={`w-8 h-8 text-lg flex items-center justify-center rounded border-2 ${
                          formData.icon === icon ? "border-foreground bg-muted" : "border-transparent hover:bg-muted"
                        } transition-colors`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
                  <span className="text-lg">{formData.icon}</span>
                  <Badge className={`${formData.color} text-white`}>{formData.name || "Category Name"}</Badge>
                </div>

                <Button
                  onClick={editingCategory ? handleEdit : handleCreate}
                  className="w-full min-h-[48px]"
                  disabled={!formData.name.trim()}
                >
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
            No categories yet. Create your first category to organize your items!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg min-h-[60px]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg flex-shrink-0">{category.icon}</span>
                  <div className="min-w-0 flex-1">
                    <Badge className={`${category.color} text-white text-xs`}>{category.name}</Badge>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(category)} className="h-8 w-8 p-0">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}