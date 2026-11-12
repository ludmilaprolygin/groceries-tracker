import { Package, ShoppingBasket, Tag, Users, type LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  short: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Stock", short: "Stock", icon: Package },
  { href: "/compras", label: "Lista de compras", short: "Lista", icon: ShoppingBasket },
  { href: "/categorias", label: "Categorías", short: "Categorías", icon: Tag },
  { href: "/grupo", label: "Grupo familiar", short: "Grupo", icon: Users },
]
