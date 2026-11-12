"use client"

import type React from "react"
import type { Session } from "@supabase/supabase-js"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { PageLoader } from "@/components/shared/PageLoader"
import { toast } from "@/hooks/use-toast"
import { NEUTRAL_SWATCHES } from "@/lib/constants"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/types"

interface AuthContextValue {
  user: User
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Signed-in household member and auth actions. Only usable inside <AuthGuard>. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthGuard>")
  return ctx
}

/** Renders its children only once a Google session is linked to a household member. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Join form (first login only)
  const [userName, setUserName] = useState("")
  const [accessKey, setAccessKey] = useState("")

  // Find the app user linked to the Google account
  const loadAppUser = useCallback(async (session: Session | null) => {
    if (!session) {
      setCurrentUser(null)
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.from("users").select("*").eq("auth_id", session.user.id).maybeSingle()

    if (error) {
      toast({ title: "Error al cargar tu cuenta", description: error.message, variant: "destructive" })
    }

    if (data) {
      setCurrentUser(data)
    } else {
      setCurrentUser(null)
      const meta = session.user.user_metadata ?? {}
      setUserName((prev) => prev || meta.full_name || meta.name || "")
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Remove the legacy localStorage session from the old access-key login
    localStorage.removeItem("grocery-tracker-user")
    localStorage.removeItem("grocery-tracker-key")

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadAppUser(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      // Only re-query on real auth changes, not on token refreshes
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Defer: calling Supabase inside this callback can deadlock the auth client
        setTimeout(() => loadAppUser(newSession), 0)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadAppUser])

  const handleGoogleLogin = async () => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      toast({ title: "No se pudo iniciar sesión", description: error.message, variant: "destructive" })
      setIsSubmitting(false)
    }
    // On success the browser is redirected to Google
  }

  const handleJoin = async () => {
    if (!session) return
    if (!userName.trim() || !accessKey.trim()) {
      toast({ title: "Faltan datos", description: "Ingresá tu nombre y la clave de acceso.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: newUser, error } = await supabase.rpc("join_household", {
        p_name: userName.trim(),
        p_color: NEUTRAL_SWATCHES[Math.floor(Math.random() * NEUTRAL_SWATCHES.length)],
        p_key: accessKey.trim(),
      })

      if (error) {
        const invalidKey = error.message.includes("Invalid access key")
        toast({
          title: invalidKey ? "Clave de acceso inválida" : "No se pudo completar el registro",
          description: invalidKey ? "La clave de acceso que ingresaste es incorrecta." : error.message,
          variant: "destructive",
        })
        return
      }

      setCurrentUser(newUser)
      setAccessKey("")
      toast({ title: "¡Cuenta creada!", description: `¡Te damos la bienvenida, ${newUser.name}!` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentUser(null)
    setUserName("")
    setAccessKey("")
    toast({ title: "Sesión cerrada", description: "Cerraste sesión correctamente." })
  }, [])

  if (isLoading) return <PageLoader />

  if (session && currentUser) {
    return <AuthContext.Provider value={{ user: currentUser, logout: handleLogout }}>{children}</AuthContext.Provider>
  }

  return (
    <LoginScreen
      session={session}
      isSubmitting={isSubmitting}
      userName={userName}
      accessKey={accessKey}
      onUserNameChange={setUserName}
      onAccessKeyChange={setAccessKey}
      onGoogleLogin={handleGoogleLogin}
      onJoin={handleJoin}
      onSwitchAccount={handleLogout}
    />
  )
}
