"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Key, UserPlus, LogIn, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useDatabase, type User } from "@/hooks/useDatabase"

interface AuthGuardProps {
  children: React.ReactNode
  onAuthenticated: (user: User) => void
}

export function AuthGuard({ children, onAuthenticated }: AuthGuardProps) {
  const { validateAccessKey, createUser, users, fetchUsers } = useDatabase()

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Form states
  const [accessKey, setAccessKey] = useState("")
  const [userName, setUserName] = useState("")
  const [loginKey, setLoginKey] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [activeTab, setActiveTab] = useState("login")

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem("grocery-tracker-user")
      const savedKey = localStorage.getItem("grocery-tracker-key")

      if (savedUser && savedKey) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser(user)
          setIsAuthenticated(true)
          onAuthenticated(user)
        } catch (error) {
          // Clear invalid session
          localStorage.removeItem("grocery-tracker-user")
          localStorage.removeItem("grocery-tracker-key")
        }
      }
      setIsLoading(false)
    }

    checkExistingSession()
  }, [onAuthenticated])

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleLogin = async () => {
    if (!loginKey.trim() || !selectedUserId) {
      toast({
        title: "Missing Information",
        description: "Please select a user and enter the access key.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Validate access key
      const isValidKey = await validateAccessKey(loginKey.trim())

      if (!isValidKey) {
        toast({
          title: "Invalid Access Key",
          description: "The access key you entered is incorrect.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Find the selected user
      const user = users.find((u) => u.id === selectedUserId)
      if (!user) {
        toast({
          title: "User Not Found",
          description: "Selected user no longer exists.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Verify user's access key matches
      if (user.access_key !== loginKey.trim()) {
        toast({
          title: "Access Denied",
          description: "This access key doesn't match the selected user.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Save session
      localStorage.setItem("grocery-tracker-user", JSON.stringify(user))
      localStorage.setItem("grocery-tracker-key", loginKey.trim())

      setCurrentUser(user)
      setIsAuthenticated(true)
      onAuthenticated(user)

      toast({
        title: "Welcome Back!",
        description: `Logged in as ${user.name}`,
      })
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userName.trim() || !accessKey.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and access key.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Validate access key first
      const isValidKey = await validateAccessKey(accessKey.trim())

      if (!isValidKey) {
        toast({
          title: "Invalid Access Key",
          description: "The access key you entered is incorrect.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if user name already exists
      const existingUser = users.find((u) => u.name.toLowerCase() === userName.trim().toLowerCase())
      if (existingUser) {
        toast({
          title: "User Already Exists",
          description: "A user with this name already exists. Please choose a different name or login instead.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Create new user
      const colors = [
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

      const newUser = await createUser({
        name: userName.trim(),
        color: colors[users.length % colors.length],
        access_key: accessKey.trim(),
      })

      // Save session
      localStorage.setItem("grocery-tracker-user", JSON.stringify(newUser))
      localStorage.setItem("grocery-tracker-key", accessKey.trim())

      setCurrentUser(newUser)
      setIsAuthenticated(true)
      onAuthenticated(newUser)

      toast({
        title: "Account Created!",
        description: `Welcome to the grocery tracker, ${newUser.name}!`,
      })
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred while creating your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("grocery-tracker-user")
    localStorage.removeItem("grocery-tracker-key")
    setCurrentUser(null)
    setIsAuthenticated(false)
    setAccessKey("")
    setUserName("")
    setLoginKey("")
    setSelectedUserId("")

    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    })
  }

  // Show loading spinner while checking session
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 animate-spin" />
          <span className="text-sm md:text-base">Loading...</span>
        </div>
      </div>
    )
  }

  // Show main app if authenticated
  if (isAuthenticated && currentUser) {
    return (
      <div className="relative">
        {/* Logout button in top corner */}
        <div className="absolute top-4 right-4 z-50">
          <Button variant="outline" size="sm" onClick={handleLogout} className="bg-background/80 backdrop-blur-sm">
            Logout
          </Button>
        </div>
        {children}
      </div>
    )
  }

  // Show authentication form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
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
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Join
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>Select your user account and enter your access key to login.</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user-select">Select Your Account</Label>
                    <select
                      id="user-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Choose your account...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="login-key">Access Key</Label>
                    <Input
                      id="login-key"
                      type="password"
                      value={loginKey}
                      onChange={(e) => setLoginKey(e.target.value)}
                      placeholder="Enter your access key"
                      className="font-mono"
                    />
                  </div>

                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    disabled={isLoading || !selectedUserId || !loginKey.trim()}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <Alert>
                  <UserPlus className="h-4 w-4" />
                  <AlertDescription>
                    Create a new account with a valid access key from an existing member.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
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
                    onClick={handleCreateUser}
                    className="w-full"
                    disabled={isLoading || !userName.trim() || !accessKey.trim()}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Help text */}
            <div className="mt-6 pt-4 border-t text-center">
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
