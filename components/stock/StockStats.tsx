import { Stat } from "@/components/shared/Stat"

interface StockStatsProps {
  itemCount: number
  lowStockCount: number
  totalQuantity: number
  categoryCount: number
}

export function StockStats({ itemCount, lowStockCount, totalQuantity, categoryCount }: StockStatsProps) {
  return (
    <div className="glass grid grid-cols-2 overflow-hidden rounded-lg md:grid-cols-4 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r [&>*]:border-foreground/10 md:[&>*:nth-child(-n+2)]:border-b-0 md:[&>*:not(:last-child)]:border-r">
      <Stat label="Items" value={itemCount} />
      <Stat label="Por acabarse" value={lowStockCount} tone={lowStockCount > 0 ? "warning" : undefined} />
      <Stat label="Unidades" value={totalQuantity} />
      <Stat label="Categorías" value={categoryCount} />
    </div>
  )
}
