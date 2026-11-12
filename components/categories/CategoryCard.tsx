import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dot } from "@/components/shared/Dot"
import type { Category } from "@/lib/types"

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div className="glass group flex items-center gap-3 rounded-lg p-3 pr-2 transition-colors hover:bg-white/70">
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
          onClick={() => onEdit(category)}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={`Editar ${category.name}`}
        >
          <Pencil className="!size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category)}
          className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Eliminar ${category.name}`}
        >
          <Trash2 className="!size-3.5" />
        </Button>
      </div>
    </div>
  )
}
