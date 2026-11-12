import type { Metadata } from "next"
import { ShoppingView } from "@/components/shopping/ShoppingView"

export const metadata: Metadata = { title: "Lista de compras" }

export default function ShoppingPage() {
  return <ShoppingView />
}
