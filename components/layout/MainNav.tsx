"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "@/components/layout/nav-items"
import { cn } from "@/lib/utils"

/** Bottom tab bar on mobile, segmented control in the header on desktop. */
export function MainNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Secciones"
      className={cn(
        // Mobile: bottom navigation bar
        "fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/60 bg-[hsl(var(--glass)/0.7)] p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_-1px_0_hsl(var(--border)/0.6)] backdrop-blur-2xl backdrop-saturate-150",
        // Desktop: segmented control in the header
        "md:static md:inline-flex md:h-10 md:w-auto md:items-center md:rounded-md md:border md:border-border/70 md:bg-foreground/[0.04] md:p-1 md:shadow-none md:backdrop-blur-none",
      )}
    >
      {NAV_ITEMS.map(({ href, label, short, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 whitespace-nowrap rounded-md px-1 py-1.5 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              "md:h-8 md:flex-row md:gap-1.5 md:rounded-[5px] md:px-4 md:py-0 md:text-[13px]",
              isActive ? "text-foreground md:bg-primary md:text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5 md:h-3.5 md:w-3.5" strokeWidth={1.75} />
            <span className="md:hidden">{short}</span>
            <span className="hidden md:inline">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
