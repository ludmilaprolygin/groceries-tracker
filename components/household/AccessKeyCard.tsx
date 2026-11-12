"use client"

import { Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/shared/FieldLabel"
import { toast } from "@/hooks/use-toast"

interface AccessKeyCardProps {
  accessKey: string
  onRegenerate: () => void
}

export function AccessKeyCard({ accessKey, onRegenerate }: AccessKeyCardProps) {
  const copyAccessKey = async () => {
    try {
      await navigator.clipboard.writeText(accessKey)
      toast({
        title: "Clave de acceso copiada",
        description: "Compartila con otros usuarios para darles acceso a tu grupo familiar.",
      })
    } catch {
      toast({
        title: "Copia fallida",
        description: "Por favor, copiá manualmente la clave de acceso.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="glass space-y-4 rounded-lg p-5">
      <div>
        <FieldLabel>Clave de acceso</FieldLabel>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Compartí esta clave para que otras personas se unan a tu grupo familiar.
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-md border bg-white/45 p-1 pl-3.5 dark:bg-white/5">
        <code className="min-w-0 flex-1 truncate font-mono text-sm">{accessKey || "—"}</code>
        <Button
          onClick={copyAccessKey}
          variant="ghost"
          size="icon"
          aria-label="Copiar clave de acceso"
          className="h-9 w-9 shrink-0 rounded-lg"
          disabled={!accessKey}
        >
          <Copy className="!size-4" />
        </Button>
      </div>
      <Button onClick={onRegenerate} variant="outline" size="sm" className="w-full">
        <RefreshCw className="!size-3.5" /> Generar nueva clave
      </Button>
    </div>
  )
}
