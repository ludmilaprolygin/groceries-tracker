import type { Metadata } from "next"
import { BrandMark } from "@/components/layout/BrandMark"
import { ReloadButton } from "@/components/pwa/ReloadButton"

export const metadata: Metadata = { title: "Sin conexión" }

/** Served by the service worker when a navigation fails while offline. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-sm flex-col items-center justify-center gap-6 px-5 text-center">
      <BrandMark />
      <div>
        <h1 className="font-display text-3xl">Sin conexión</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No pudimos conectarnos. Revisá tu conexión a internet y volvé a intentar.
        </p>
      </div>
      <ReloadButton />
    </main>
  )
}
