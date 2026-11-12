"use client"

import type React from "react"
import type { Session } from "@supabase/supabase-js"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, UserPlus, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { User } from "@/hooks/useDatabase"

interface AuthGuardProps {
  children: React.ReactNode
  onAuthenticated: (user: User) => void
}

const USER_COLORS = [
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
]

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 animate-spin" />
          <span className="text-sm md:text-base">Loading...</span>
        </div>
      </div>
    )
  }

  if (session && currentUser) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <Button variant="outline" size="sm" onClick={handleLogout} className="bg-background/80 backdrop-blur-sm">
            Logout
          </Button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Grocery Tracker</h1>
          </div>
          <p className="text-muted-foreground">Secure access required to manage your grocery inventory</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              {session ? <UserPlus className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
              {session ? "Join the Tracker" : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!session ? (
              <Button onClick={handleGoogleLogin} className="w-full gap-2" variant="outline" disabled={isSubmitting}>
                <GoogleIcon />
                {isSubmitting ? "Redirecting..." : "Continue with Google"}
              </Button>
            ) : (
              <>
                <Alert>
                  <UserPlus className="h-4 w-4" />
                  <AlertDescription>
                    Signed in as <strong>{session.user.email}</strong>. Enter the access key from an existing member
                    to join.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-2">
                  <Label htmlFor="new-user-name">Your Name</Label>
                  <Input
                    id="new-user-name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="access-key">Access Key</Label>
                  <Input
                    id="access-key"
                    type="password"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="Enter the access key"
                    className="font-mono"
                  />
                </div>

                <Button
                  onClick={handleJoin}
                  className="w-full"
                  disabled={isSubmitting || !userName.trim() || !accessKey.trim()}
                >
                  {isSubmitting ? "Creating Account..." : "Join"}
                </Button>

                <Button onClick={handleLogout} variant="ghost" className="w-full" disabled={isSubmitting}>
                  Use a different Google account
                </Button>
              </>
            )}

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Need an access key? Ask an existing member to share theirs with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
