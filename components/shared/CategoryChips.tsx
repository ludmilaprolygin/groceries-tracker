import { Chip } from "@/components/shared/Chip"
import type { Category } from "@/lib/types"

interface CategoryChipsProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string | null) => void
  /** Label of the chip that clears the selection. */
  noneLabel: string
  className?: string
}

/** Horizontal row of category chips with a leading "none / all" option. */
export function CategoryChips({ categories, value, onChange, noneLabel, className }: CategoryChipsProps) {
  return (
    <div className={className}>
      <Chip active={value === null} onClick={() => onChange(null)}>
        {noneLabel}
      </Chip>
      {categories.map((category) => (
        <Chip key={category.id} active={value === category.id} onClick={() => onChange(category.id)}>
          <span className="text-base leading-none">{category.icon}</span>
          {category.name}
        </Chip>
      ))}
    </div>
  )
}
