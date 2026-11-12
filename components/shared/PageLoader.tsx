import { Loader2 } from "lucide-react"

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-4">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
