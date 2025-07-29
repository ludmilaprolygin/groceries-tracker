"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, Search, Edit2, Trash2, Package, ChevronDown, ChevronRight, MapPin, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, CheckCircle2, Circle } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Users, Key, Copy, UserPlus, UserMinus, Settings, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { useDatabase, type User, type GroceryItem } from "@/hooks/useDatabase"
import { KITCHEN_LOCATIONS } from "@/components/LocationGrid"
import { QuantityAdjuster } from "@/components/QuantityAdjuster"
import { AuthGuard } from "@/components/AuthGuard"
import { FormDialogContent } from "@/components/FormDialogContent"
import { CategoryManager } from "@/components/CategoryManager"

function GroceryTracker() {
  const {
    users,
    categories,
    items,
    shoppingList,
    loading,
    createUser,
    updateUser,
    deleteUser,
    createCategory,
    updateCategory,
    deleteCategory,
    createGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    createShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    validateAccessKey,
    generateAccessKey,
  } = useDatabase()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [accessKey, setAccessKey] = useState<string>(
    process.env.ACCESS_KEY || "",
  )
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [joinKey, setJoinKey] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    storageLocations: [] as { location: string; quantity: string }[],
    allowedUsers: [] as string[],
    selectedLocations: [] as string[],
    locationCategory: null as "lavadero" | "cocina" | "otros" | null,
    categoryId: undefined as string | undefined, // ← This was the fix
  })
  const [activeTab, setActiveTab] = useState("stock")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  // Handle authentication
  const handleAuthenticated = useCallback((user: User) => {
    setCurrentUser(user)
  }, [])

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(debouncedSearchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [debouncedSearchTerm])

  // Prevent scroll to top when dialogs close
  const preventScrollToTop = useCallback(() => {
    const currentScrollY = window.scrollY
    setTimeout(() => {
      window.scrollTo(0, currentScrollY)
    }, 0)
  }, [])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Memoize filtered items to prevent recalculation on every render
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.storageLocations.some((loc) => loc.location.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCategory = selectedCategoryFilter ? item.category?.id === selectedCategoryFilter : true

        return matchesSearch && matchesCategory
      }),
    [items, searchTerm, selectedCategoryFilter],
  )

  // Memoize utility functions
  const getTotalQuantity = useCallback((item: GroceryItem) => {
    return item.storageLocations.reduce((total, location) => total + location.quantity, 0)
  }, [])

  const getQuantityBadgeVariant = useCallback((quantity: number) => {
    if (quantity <= 1) return "destructive"
    if (quantity <= 3) return "secondary"
    return "default"
  }, [])

  // Wrap form handlers in useCallback
  const handleFormDataChange = useCallback((updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateStorageLocation = useCallback((index: number, field: "location" | "quantity", value: string) => {
    if (field === "quantity" && value === "0") {
      // Remove this location when quantity becomes 0
      setFormData((prev) => ({
        ...prev,
        storageLocations: prev.storageLocations.filter((_, i) => i !== index),
        selectedLocations: prev.selectedLocations.filter((_, i) => i !== index),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        storageLocations: prev.storageLocations.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc)),
      }))
    }
  }, [])

  const handleAddItem = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (
        formData.name &&
        formData.storageLocations.some((loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0)
      ) {
        const validStorageLocations = formData.storageLocations
          .filter((loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0)
          .map((loc) => ({
            location: loc.location,
            quantity: Number.parseInt(loc.quantity),
          }))

        await createGroceryItem({
          name: formData.name,
          storageLocations: validStorageLocations,
          allowedUsers: formData.allowedUsers.length > 0 ? formData.allowedUsers : [currentUser?.id || ""],
          categoryId: formData.categoryId,
        })

        resetForm()
        preventScrollToTop()
        setIsAddDialogOpen(false)
      }
    },
    [formData, createGroceryItem, currentUser, preventScrollToTop],
  )

  const handleEditItem = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (
        editingItem &&
        formData.name &&
        formData.storageLocations.some((loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0)
      ) {
        const validStorageLocations = formData.storageLocations
          .filter((loc) => loc.location && loc.quantity && Number.parseInt(loc.quantity) > 0)
          .map((loc) => ({
            location: loc.location,
            quantity: Number.parseInt(loc.quantity),
          }))

        await updateGroceryItem(editingItem.id, {
          name: formData.name,
          storageLocations: validStorageLocations,
          allowedUsers: formData.allowedUsers,
          categoryId: formData.categoryId,
        })

        setEditingItem(null)
        resetForm()
        preventScrollToTop()
      }
    },
    [editingItem, formData, updateGroceryItem, preventScrollToTop],
  )

  const handleDeleteItem = useCallback(
    async (id: string) => {
      await deleteGroceryItem(id)
    },
    [deleteGroceryItem],
  )

  const openEditDialog = useCallback((item: GroceryItem) => {
    setEditingItem(item)
    const selectedLocationIds = item.storageLocations.map((loc) => {
      const foundLocation = KITCHEN_LOCATIONS.find((kitchenLoc) => kitchenLoc.name === loc.location)
      return foundLocation ? foundLocation.id : loc.location
    })

    setFormData({
      name: item.name,
      storageLocations: item.storageLocations.map((loc) => ({
        location: loc.location,
        quantity: loc.quantity.toString(),
      })),
      allowedUsers: item.allowedUsers,
      selectedLocations: selectedLocationIds,
      locationCategory: null,
      categoryId: item.category?.id,
    })
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      storageLocations: [],
      allowedUsers: [],
      selectedLocations: [],
      locationCategory: null,
      categoryId: undefined,
    })
    setEditingItem(null)
  }, [])

  const resetFormForShopping = useCallback(() => {
    setFormData({
      name: "",
      storageLocations: [{ location: "", quantity: "1" }], // Remove "Shopping List" as location
      allowedUsers: [],
      selectedLocations: [],
      locationCategory: null,
      categoryId: undefined,
    })
    setEditingItem(null)
  }, [])

  const toggleUserSelection = useCallback((userId: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedUsers: prev.allowedUsers.includes(userId)
        ? prev.allowedUsers.filter((id) => id !== userId)
        : [...prev.allowedUsers, userId],
    }))
  }, [])

  const toggleItemExpansion = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId)
      } else {
        newExpanded.add(itemId)
      }
      return newExpanded
    })
  }, [])

  const handleAddToShoppingList = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (formData.name && formData.storageLocations[0]?.quantity) {
        await createShoppingItem({
          name: formData.name,
          quantity: Number.parseInt(formData.storageLocations[0].quantity),
          location: "Shopping List",
          isCompleted: false,
          addedDate: new Date().toISOString().split("T")[0],
        })

        resetForm()
        preventScrollToTop()
        setIsAddDialogOpen(false)
      }
    },
    [formData, createShoppingItem, resetForm, preventScrollToTop],
  )

  const handleToggleShoppingItem = useCallback(
    async (id: string) => {
      const item = shoppingList.find((item) => item.id === id)
      if (item) {
        await updateShoppingItem(id, { isCompleted: !item.isCompleted })
      }
    },
    [shoppingList, updateShoppingItem],
  )

  const handleDeleteShoppingItem = useCallback(
    async (id: string) => {
      await deleteShoppingItem(id)
    },
    [deleteShoppingItem],
  )

  const addLowStockToShoppingList = useCallback(async () => {
    const lowStockItems = items.filter((item) => getTotalQuantity(item) <= 3)
    const newShoppingItems = lowStockItems.filter(
      (stockItem) => !shoppingList.some((shopItem) => shopItem.name.toLowerCase() === stockItem.name.toLowerCase()),
    )

    for (const item of newShoppingItems) {
      await createShoppingItem({
        name: item.name,
        quantity: 1,
        location: item.storageLocations[0]?.location || "Unknown",
        isCompleted: false,
        addedDate: new Date().toISOString().split("T")[0],
      })
    }
  }, [items, shoppingList, getTotalQuantity, createShoppingItem])

  const regenerateAccessKey = useCallback(async () => {
    try {
      const newKey = await generateAccessKey()
      setAccessKey(newKey)
    } catch (error) {
      // Error handled in hook
    }
  }, [generateAccessKey])

  const copyAccessKey = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(accessKey)
      toast({
        title: "Access Key Copied",
        description: "Share this key with others to give them access.",
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the key manually.",
        variant: "destructive",
      })
    }
  }, [accessKey])

  const addNewUser = useCallback(async () => {
    if (newUserName.trim()) {
      const colors = [
        "bg-red-500",
        "bg-green-500",
        "bg-blue-500",
        "bg-yellow-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-orange-500",
      ]

      await createUser({
        name: newUserName.trim(),
        color: colors[users.length % colors.length],
        access_key: accessKey,
      })

      setNewUserName("")
    }
  }, [newUserName, users.length, accessKey, createUser])

  const removeUser = useCallback(
    async (userId: string) => {
      if (userId === currentUser?.id) {
        toast({
          title: "Cannot Remove Current User",
          description: "You cannot remove yourself from the tracker.",
          variant: "destructive",
        })
        return
      }

      await deleteUser(userId)
    },
    [currentUser?.id, deleteUser],
  )

  const joinWithKey = useCallback(async () => {
    const isValid = await validateAccessKey(joinKey.trim())

    if (isValid) {
      if (newUserName.trim()) {
        await addNewUser()
        setJoinKey("")
        setShowKeyInput(false)
      } else {
        toast({
          title: "Name Required",
          description: "Please enter your name to join.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Invalid Access Key",
        description: "The access key you entered is incorrect.",
        variant: "destructive",
      })
    }
  }, [joinKey, newUserName, validateAccessKey, addNewUser])

  const switchUser = useCallback((user: User) => {
    setCurrentUser(user)
    // Update localStorage
    localStorage.setItem("grocery-tracker-user", JSON.stringify(user))
    toast({
      title: "User Switched",
      description: `Now using the tracker as ${user.name}.`,
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm md:text-base">Loading grocery tracker...</span>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard onAuthenticated={handleAuthenticated}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-2 md:p-4 max-w-6xl">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-xl md:text-3xl font-bold">Grocery Tracker</h1>
            {currentUser && (
              <Badge variant="outline" className="ml-auto text-xs">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${currentUser.color} mr-1 md:mr-2`} />
                <span className="hidden sm:inline">{currentUser.name}</span>
                <span className="sm:hidden">{currentUser.name.charAt(0)}</span>
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6">
              <TabsTrigger value="stock" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Package className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Stock</span>
                <span className="sm:hidden">📦</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">🏷️</span>
              </TabsTrigger>
              <TabsTrigger value="shopping" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Shopping</span>
                <span className="sm:hidden">🛒</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Users</span>
                <span className="sm:hidden">👥</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="space-y-4 md:space-y-6">
              {/* Stats Cards - Mobile Optimized */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold">{items.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold text-orange-600">
                      {items.filter((item) => getTotalQuantity(item) <= 3).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold">{categories.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Qty</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold">
                      {items.reduce((total, item) => total + getTotalQuantity(item), 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Controls */}
              <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search items..."
                    value={debouncedSearchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setDebouncedSearchTerm(e.target.value)
                    }}
                    className="pl-10 text-base" // Prevent zoom on iOS
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={selectedCategoryFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="flex items-center gap-2 min-h-[44px] md:min-h-auto whitespace-nowrap"
                  >
                    <span>📦</span>
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategoryFilter === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategoryFilter(category.id)}
                      className="flex items-center gap-2 min-h-[44px] md:min-h-auto whitespace-nowrap"
                    >
                      <span>{category.icon}</span>
                      {category.name}
                    </Button>
                  ))}
                </div>

                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      preventScrollToTop()
                    }
                    setIsAddDialogOpen(open)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => resetForm()} className="min-h-[44px] md:min-h-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Item</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Edit Grocery Item" : "Add New Grocery Item"}</DialogTitle>
                    </DialogHeader>
                    <FormDialogContent
                      formData={formData}
                      setFormData={setFormData}
                      activeTab={activeTab}
                      users={users}
                      categories={categories}
                      editingItem={editingItem}
                      updateStorageLocation={updateStorageLocation}
                      toggleUserSelection={toggleUserSelection}
                      handleAddItem={handleAddItem}
                      handleEditItem={handleEditItem}
                      handleAddToShoppingList={handleAddToShoppingList}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Items Display - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl">Your Grocery Stock</CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                      {searchTerm || selectedCategoryFilter
                        ? "No items match your filters."
                        : "No items in stock. Add your first item!"}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="border rounded-lg">
                          <Collapsible
                            open={expandedItems.has(item.id)}
                            onOpenChange={() => toggleItemExpansion(item.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 cursor-pointer min-h-[60px] md:min-h-auto">
                                <div className="flex items-center gap-2 md:gap-3 flex-1">
                                  {expandedItems.has(item.id) ? (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="font-medium text-sm md:text-base truncate">{item.name}</div>
                                      {item.category && (
                                        <Badge className={`${item.category.color} text-white text-xs`}>
                                          {item.category.icon} {item.category.name}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">
                                      {item.storageLocations.length} location
                                      {item.storageLocations.length !== 1 ? "s" : ""}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                                  <Badge variant={getQuantityBadgeVariant(getTotalQuantity(item))} className="text-xs">
                                    {getTotalQuantity(item)}
                                  </Badge>
                                  <div className="hidden md:flex items-center gap-1">
                                    {item.allowedUsers.map((userId) => {
                                      const user = users.find((u) => u.id === userId)
                                      return user ? (
                                        <div
                                          key={userId}
                                          className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-xs font-medium`}
                                          title={user.name}
                                        >
                                          {user.name.charAt(0)}
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                  <div className="flex gap-1 md:gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditDialog(item)
                                        setIsAddDialogOpen(true)
                                      }}
                                      className="h-8 w-8 md:h-9 md:w-9 p-0"
                                    >
                                      <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteItem(item.id)
                                      }}
                                      className="h-8 w-8 md:h-9 md:w-9 p-0"
                                    >
                                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-3 md:px-4 pb-3 md:pb-4 border-t bg-muted/20">
                                <div className="pt-3 space-y-3">
                                  {item.storageLocations.map((location) => (
                                    <div
                                      key={location.id}
                                      className="flex items-center justify-between py-3 px-3 bg-background rounded-lg border"
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="font-medium text-sm md:text-base truncate">
                                          {location.location}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <QuantityAdjuster
                                          value={location.quantity}
                                          onChange={async (newQuantity) => {
                                            if (newQuantity === 0) {
                                              // Remove this location entirely
                                              const updatedLocations = item.storageLocations.filter(
                                                (loc) => loc.id !== location.id,
                                              )

                                              if (updatedLocations.length === 0) {
                                                // If no locations left, delete the entire item
                                                await handleDeleteItem(item.id)
                                              } else {
                                                await updateGroceryItem(item.id, {
                                                  storageLocations: updatedLocations.map((loc) => ({
                                                    location: loc.location,
                                                    quantity: loc.quantity,
                                                  })),
                                                })
                                              }
                                            } else {
                                              const updatedLocations = item.storageLocations.map((loc) =>
                                                loc.id === location.id ? { ...loc, quantity: newQuantity } : loc,
                                              )

                                              await updateGroceryItem(item.id, {
                                                storageLocations: updatedLocations.map((loc) => ({
                                                  location: loc.location,
                                                  quantity: loc.quantity,
                                                })),
                                              })
                                            }
                                          }}
                                          min={0}
                                          max={999}
                                        />
                                        <Badge
                                          variant={getQuantityBadgeVariant(location.quantity)}
                                          className="min-w-[50px] justify-center text-xs"
                                        >
                                          {location.quantity}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="text-xs text-muted-foreground pt-2 border-t">
                                    Added: {item.addedDate} • Total: {getTotalQuantity(item)} items
                                    {item.category && (
                                      <span>
                                        {" "}
                                        • Category: {item.category.icon} {item.category.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4 md:space-y-6">
              <CategoryManager
                categories={categories}
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
              />
            </TabsContent>

            <TabsContent value="shopping" className="space-y-4 md:space-y-6">
              {/* Shopping List Stats - Mobile Optimized */}
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">To Buy</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold">
                      {shoppingList.filter((item) => !item.isCompleted).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Done</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {shoppingList.filter((item) => item.isCompleted).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold">{shoppingList.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Shopping List Controls */}
              <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <Button
                  onClick={addLowStockToShoppingList}
                  variant="outline"
                  className="min-h-[44px] md:min-h-auto bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Low Stock Items</span>
                  <span className="sm:hidden">Add Low Stock</span>
                </Button>

                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      preventScrollToTop()
                    }
                    setIsAddDialogOpen(open)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => resetFormForShopping()} className="min-h-[44px] md:min-h-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Item to List</span>
                      <span className="sm:hidden">Add Item</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Item to Shopping List</DialogTitle>
                    </DialogHeader>
                    <FormDialogContent
                      formData={formData}
                      setFormData={setFormData}
                      activeTab={activeTab}
                      users={users}
                      categories={categories}
                      editingItem={editingItem}
                      updateStorageLocation={updateStorageLocation}
                      toggleUserSelection={toggleUserSelection}
                      handleAddItem={handleAddItem}
                      handleEditItem={handleEditItem}
                      handleAddToShoppingList={handleAddToShoppingList}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Shopping List - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl">Shopping List</CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  {shoppingList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                      No items in your shopping list. Add items or import low stock items!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shoppingList.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 md:p-4 rounded-lg border min-h-[60px] ${
                            item.isCompleted ? "bg-muted/50 opacity-75" : "bg-background"
                          }`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleShoppingItem(item.id)}
                            className="p-0 h-auto min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            {item.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium text-sm md:text-base truncate ${
                                item.isCompleted ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {item.name}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">Qty: {item.quantity}</div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShoppingItem(item.id)}
                            className="text-muted-foreground hover:text-destructive min-w-[44px] min-h-[44px] p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 md:space-y-6">
              {/* Current User - Mobile Optimized */}
              {currentUser && (
                <Card>
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${currentUser.color}`} />
                      Current User: {currentUser.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {users.map((user) => (
                        <Button
                          key={user.id}
                          variant={currentUser.id === user.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => switchUser(user)}
                          className="flex items-center gap-2 min-h-[44px] md:min-h-auto"
                        >
                          <div className={`w-3 h-3 rounded-full ${user.color}`} />
                          {user.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Access Key Management - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Key className="h-4 w-4 md:h-5 md:w-5" />
                    Access Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Share this key with others to give them access to your grocery tracker.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input value={accessKey} readOnly className="font-mono text-xs md:text-sm flex-1" />
                    <div className="flex gap-2">
                      <Button
                        onClick={copyAccessKey}
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] md:min-h-auto flex-1 md:flex-none bg-transparent"
                      >
                        <Copy className="h-4 w-4 mr-2 md:mr-0" />
                        <span className="md:hidden">Copy</span>
                      </Button>
                      <Button
                        onClick={regenerateAccessKey}
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] md:min-h-auto flex-1 md:flex-none bg-transparent"
                      >
                        <span className="text-xs md:text-sm">Regenerate</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add New User - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
                    Add New User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showKeyInput ? (
                    <Button onClick={() => setShowKeyInput(true)} className="w-full min-h-[48px]">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join with Access Key
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label htmlFor="user-name">Your Name</Label>
                        <Input
                          id="user-name"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Enter your name"
                          className="text-base" // Prevent zoom on iOS
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="access-key">Access Key</Label>
                        <Input
                          id="access-key"
                          value={joinKey}
                          onChange={(e) => setJoinKey(e.target.value)}
                          placeholder="Enter the access key"
                          className="font-mono text-base" // Prevent zoom on iOS
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Button onClick={joinWithKey} className="flex-1 min-h-[48px]">
                          Join Tracker
                        </Button>
                        <Button
                          onClick={() => {
                            setShowKeyInput(false)
                            setJoinKey("")
                            setNewUserName("")
                          }}
                          variant="outline"
                          className="flex-1 min-h-[48px]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Add */}
                  <div className="border-t pt-4">
                    <div className="text-sm text-muted-foreground mb-2">Quick add user (you have the key):</div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <Input
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="User name"
                        className="text-base flex-1" // Prevent zoom on iOS
                      />
                      <Button
                        onClick={addNewUser}
                        disabled={!newUserName.trim()}
                        className="min-h-[44px] md:min-h-auto"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manage Users - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Settings className="h-4 w-4 md:h-5 md:w-5" />
                    Manage Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg min-h-[60px]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white font-medium flex-shrink-0`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm md:text-base truncate">{user.name}</div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              {user.id === currentUser?.id ? "Current User" : "Member"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {items.filter((item) => item.allowedUsers.includes(user.id)).length}
                          </Badge>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeUser(user.id)}
                              className="text-destructive hover:text-destructive min-w-[44px] min-h-[44px] p-0"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}

export default GroceryTracker