import { BrandMark } from "@/components/layout/BrandMark"
import { MainNav } from "@/components/layout/MainNav"
import { UserMenu } from "@/components/layout/UserMenu"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 shadow-[0_1px_0_hsl(var(--border)/0.6)]">
      {/* Blur lives on its own layer so the fixed mobile nav below isn't trapped by backdrop-filter */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[hsl(var(--glass)/0.6)] backdrop-blur-2xl backdrop-saturate-150"
      />
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-8">
        <BrandMark compact />
        <MainNav />
        <UserMenu />
      </div>
    </header>
  )
}
