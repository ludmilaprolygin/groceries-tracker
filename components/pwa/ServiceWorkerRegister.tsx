"use client"

import { useEffect } from "react"

/** Registers /sw.js in production builds only, so dev hot-reload isn't served stale assets. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.error("Service worker registration failed", err)
    })
  }, [])
  return null
}
