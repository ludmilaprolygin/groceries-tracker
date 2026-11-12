import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LowStockBannerProps {
  count: number
  onAddAll: () => void
  busy?: boolean
}

export function LowStockBanner({ count, onAddAll, busy }: LowStockBannerProps) {
  return (
    <div className="glass flex items-center justify-between gap-4 rounded-lg border-l-2 !border-l-warning p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {count} {count === 1 ? "item se está acabando" : "items se están acabando"}
        </p>
        <p className="text-xs text-muted-foreground">Agregalos a la lista con un toque.</p>
      </div>
      <Button onClick={onAddAll} disabled={busy} variant="outline" size="sm" className="shrink-0">
        <Plus /> Agregar todos
      </Button>
    </div>
  )
}
