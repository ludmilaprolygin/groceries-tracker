import type React from "react"
import { AppShell } from "@/components/layout/AppShell"

/** Every route in this group requires a signed-in household member and shares the loaded data. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
