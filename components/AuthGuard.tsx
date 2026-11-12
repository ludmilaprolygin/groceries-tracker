"use client"

import type React from "react"
import type { Session } from "@supabase/supabase-js"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { FieldLabel, NEUTRAL_SWATCHES } from "@/components/Primitives"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { User } from "@/hooks/useDatabase"

interface AuthGuardProps {
  children: React.ReactNode
  onAuthenticated: (user: User) => void
}

const USER_COLORS = NEUTRAL_SWATCHES

const AuthContext = createContext<{ logout: () => Promise<void> }>({ logout: async () => {} })

/** Access auth actions (e.g. logout) from inside the guarded app. */
export const useAuth = () => useContext(AuthContext)

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function AuthGuard({ children, onAuthenticated }: AuthGuardProps) {

  const [session, setSession] = useState<Session | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Join form (first login only)
  const [userName, setUserName] = useState("")
  const [accessKey, setAccessKey] = useState("")

  // Find the app user linked to the Google account
  const loadAppUser = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setCurrentUser(null)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", session.user.id)
        .maybeSingle()

      if (error) {
        toast({ title: "Error loading your account", description: error.message, variant: "destructive" })
      }

      if (data) {
        setCurrentUser(data)
        onAuthenticated(data)
      } else {
        setCurrentUser(null)
        const meta = session.user.user_metadata ?? {}
        setUserName((prev) => prev || meta.full_name || meta.name || "")
      }
      setIsLoading(false)
    },
    [onAuthenticated],
  )

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
      toast({ title: "Login Failed", description: error.message, variant: "destructive" })
      setIsSubmitting(false)
    }
    // On success the browser is redirected to Google
  }

  const handleJoin = async () => {
    if (!session) return
    if (!userName.trim() || !accessKey.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and the access key.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: newUser, error } = await supabase.rpc("join_household", {
        p_name: userName.trim(),
        p_color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
        p_key: accessKey.trim(),
      })

      if (error) {
        const invalidKey = error.message.includes("Invalid access key")
        toast({
          title: invalidKey ? "Invalid Access Key" : "Registration Failed",
          description: invalidKey ? "The access key you entered is incorrect." : error.message,
          variant: "destructive",
        })
        return
      }

      setCurrentUser(newUser)
      onAuthenticated(newUser)
      setAccessKey("")
      toast({ title: "Account Created!", description: `Welcome to the grocery tracker, ${newUser.name}!` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCurrentUser(null)
    setUserName("")
    setAccessKey("")
    toast({ title: "Logged Out", description: "You have been logged out successfully." })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (session && currentUser) {
    return <AuthContext.Provider value={{ logout: handleLogout }}>{children}</AuthContext.Provider>
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      {/* Soft warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_at_top,hsl(38_30%_88%),transparent_70%)] dark:opacity-20"
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
        <div className="mb-10">
          <BrandMark className="mb-8" />
          <h1 className="font-display text-[2.5rem] leading-[1.05]">
            {session ? (
              <>
                Almost <span className="text-muted-foreground">there.</span>
              </>
            ) : (
              <>
                Your pantry, <span className="text-muted-foreground">quietly</span> organised.
              </>
            )}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {session ? (
              <>
                Signed in as <span className="font-medium text-foreground">{session.user.email}</span>. Enter the access
                key shared by a member of your household to join.
              </>
            ) : (
              "Track what you have, where it lives, and what to buy next — shared with your household."
            )}
          </p>
        </div>

        {!session ? (
          <Button onClick={handleGoogleLogin} className="h-12 w-full gap-3 text-[15px]" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            {isSubmitting ? "Redirecting…" : "Continue with Google"}
          </Button>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-2">
              <FieldLabel htmlFor="new-user-name">Your name</FieldLabel>
              <Input
                id="new-user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="How should we call you?"
                className="h-12"
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="access-key">Access key</FieldLabel>
              <Input
                id="access-key"
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="••••••••"
                className="h-12 font-mono"
              />
            </div>

            <Button
              onClick={handleJoin}
              className="h-12 w-full text-[15px]"
              disabled={isSubmitting || !userName.trim() || !accessKey.trim()}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Creating account…" : "Join household"}
            </Button>

            <Button onClick={handleLogout} variant="ghost" className="w-full text-muted-foreground" disabled={isSubmitting}>
              Use a different Google account
            </Button>
          </div>
        )}

        <p className="mt-10 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          Need an access key? Ask an existing member to share it with you from the Household tab.
        </p>
      </main>
    </div>
  )
}
