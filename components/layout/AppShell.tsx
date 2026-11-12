"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { AppHeader } from "@/components/layout/AppHeader"
import { DataProvider, useData } from "@/components/providers/DataProvider"
import { PageLoader } from "@/components/shared/PageLoader"

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading } = useData()

  if (loading) return <PageLoader label="Cargando tu despensa…" />

  return (
    <div className="min-h-[100dvh]">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7 md:px-8 md:pb-20 md:pt-12">
        {children}
      </main>
    </div>
  )
}

/** Authenticated application frame: login gate, shared data and navigation. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DataProvider>
        <AppContent>{children}</AppContent>
      </DataProvider>
    </AuthGuard>
  )
}
