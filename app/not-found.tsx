import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/layout/BrandMark"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-sm flex-col items-center justify-center gap-6 px-5 text-center">
      <BrandMark />
      <div>
        <h1 className="font-display text-3xl">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">La sección que buscás no existe.</p>
      </div>
      <Button asChild>
        <Link href="/">Volver al stock</Link>
      </Button>
    </main>
  )
}
