"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useDatabase } from "@/hooks/useDatabase"

type DataContextValue = ReturnType<typeof useDatabase> & {
  accessKey: string
  regenerateAccessKey: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

/** Household data (stock, shopping list, categories, members) shared by every route. */
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used inside <DataProvider>")
  return ctx
}

/**
 * Loads all household data once and keeps it in memory while navigating between routes.
 * Must be mounted inside <AuthGuard>: RLS only returns rows to authenticated members.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase()
  const { fetchLatestAccessKey, generateAccessKey } = db
  const [accessKey, setAccessKey] = useState("")

  useEffect(() => {
    fetchLatestAccessKey().then(setAccessKey)
  }, [fetchLatestAccessKey])

  const regenerateAccessKey = useCallback(async () => {
    try {
      setAccessKey(await generateAccessKey())
    } catch {
      // Error already reported by the hook
    }
  }, [generateAccessKey])

  return <DataContext.Provider value={{ ...db, accessKey, regenerateAccessKey }}>{children}</DataContext.Provider>
}
