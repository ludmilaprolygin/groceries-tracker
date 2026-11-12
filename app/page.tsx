"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  ChevronDown,
  MapPin,
  Tag,
  ShoppingBasket,
  Users,
  Copy,
  RefreshCw,
  UserMinus,
  Loader2,
  Check,
  LogOut,
  Settings2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { useDatabase, type User, type GroceryItem } from "@/hooks/useDatabase"
import { KITCHEN_LOCATIONS } from "@/components/LocationGrid"
import { QuantityAdjuster } from "@/components/QuantityAdjuster"
import { AuthGuard, useAuth } from "@/components/AuthGuard"
import { FormDialogContent } from "@/components/FormDialogContent"
import { CategoryManager } from "@/components/CategoryManager"
import { BrandMark } from "@/components/BrandMark"
import { Avatar, Chip, Dot, EmptyState, FieldLabel, SectionHeader, Stat } from "@/components/Primitives"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { value: "stock", label: "Stock", short: "Stock", icon: Package },
  { value: "shopping", label: "Lista de compras", short: "Lista", icon: ShoppingBasket },
  { value: "categories", label: "Categorías", short: "Categorías", icon: Tag },
  { value: "users", label: "Grupo familiar", short: "Grupo", icon: Users },
] as const

const LOW_STOCK_THRESHOLD = 3

function UserMenu({ user, onOpenSettings }: { user: User; onOpenSettings: () => void }) {
  const { logout } = useAuth()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:pl-3"
          aria-label="Menú de la cuenta"
        >
          <span className="hidden max-w-[10rem] truncate text-sm font-medium lg:inline">{user.name}</span>
          <Avatar name={user.name} color={user.color} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass w-60 rounded-lg p-1.5">
        <DropdownMenuLabel className="px-2.5 py-2 font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-md px-2.5 py-2" onSelect={onOpenSettings}>
          <Settings2 className="mr-2 h-4 w-4" /> Ajustes del grupo familiar
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md px-2.5 py-2 text-destructive focus:text-destructive" onSelect={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GroceryTracker() {
  const {
    users,
    categories,
    items,
    shoppingList,
    loading,
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
    generateAccessKey,
    fetchLatestAccessKey,
    fetchUsers,
    fetchCategories,
    fetchGroceryItems,
    fetchShoppingList,
  } = useDatabase()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [accessKey, setAccessKey] = useState<string>("")

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

  // Handle authentication
  // RLS only returns data to members, so reload everything once the user is authenticated
  const handleAuthenticated = useCallback(
    (user: User) => {
      setCurrentUser(user)
      fetchUsers()
      fetchCategories()
      fetchGroceryItems()
      fetchShoppingList()
      fetchLatestAccessKey().then(setAccessKey)
    },
    [fetchUsers, fetchCategories, fetchGroceryItems, fetchShoppingList, fetchLatestAccessKey],
  )

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
        title: "Clave de acceso copiada",
        description: "Compartila con otros usuarios para darles acceso a tu grupo familiar.",
      })
    } catch (err) {
      toast({
        title: "Copia fallida",
        description: "Por favor, copiá manualmente la clave de acceso.",
        variant: "destructive",
      })
    }
  }, [accessKey])

  const removeUser = useCallback(
    async (userId: string) => {
      if (userId === currentUser?.id) {
        toast({
          title: "No se puede eliminar el usuario actual",
          description: "No puedes eliminarte a ti mismo del rastreador.",
          variant: "destructive",
        })
        return
      }

      await deleteUser(userId)
    },
    [currentUser?.id, deleteUser],
  )

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Cargando tu despensa…</span>
      </div>
    )
  }

  // Derived values (plain computations: hooks can't run after the early return above)
  const lowStockCount = items.filter((item) => getTotalQuantity(item) <= LOW_STOCK_THRESHOLD).length
  const totalQuantity = items.reduce((total, item) => total + getTotalQuantity(item), 0)
  const pendingShopping = shoppingList.filter((item) => !item.isCompleted)
  const completedShopping = shoppingList.filter((item) => item.isCompleted)
  const shoppingProgress = shoppingList.length ? Math.round((completedShopping.length / shoppingList.length) * 100) : 0

  const itemDialog = (mode: "stock" | "shopping") => (
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
        <Button onClick={() => (mode === "stock" ? resetForm() : resetFormForShopping())} className="h-10">
          <Plus />
          <span className="hidden sm:inline">{mode === "stock" ? "Agregar item" : "Agregar a la lista de compras"}</span>
          <span className="sm:hidden">Agregar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "shopping" ? "Agregar a la lista de compras" : editingItem ? "Editar item" : "Nuevo item"}
          </DialogTitle>
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
  )

  const renderShoppingRow = (item: (typeof shoppingList)[number]) => (
    <li key={item.id} className="group flex items-center gap-3 px-3 py-2 md:px-4">
      <button
        onClick={() => handleToggleShoppingItem(item.id)}
        aria-label={item.isCompleted ? `Marcar ${item.name} como pendiente` : `Marcar ${item.name} como comprado`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] transition-all",
            item.isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-foreground/25 group-hover:border-foreground/50",
          )}
        >
          {item.isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[15px] transition-colors",
            item.isCompleted && "text-muted-foreground line-through decoration-foreground/30",
          )}
        >
          {item.name}
        </p>
      </div>

      <span className="shrink-0 rounded-[4px] bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
        ×{item.quantity}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDeleteShoppingItem(item.id)}
        aria-label={`Quitar ${item.name}`}
        className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="!size-4" />
      </Button>
    </li>
  )

  return (
    <AuthGuard onAuthenticated={handleAuthenticated}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-[100dvh]">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/50 shadow-[0_1px_0_hsl(var(--border)/0.6)]">
          {/* Blur lives on its own layer so the fixed mobile nav below isn't trapped by backdrop-filter */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-[hsl(var(--glass)/0.6)] backdrop-blur-2xl backdrop-saturate-150" />
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-8">
            <BrandMark compact />

            <TabsList
              className={cn(
                // Mobile: bottom navigation bar
                "fixed inset-x-0 bottom-0 z-40 grid h-auto grid-cols-4 rounded-none border-t border-white/60 bg-[hsl(var(--glass)/0.7)] shadow-[0_-1px_0_hsl(var(--border)/0.6)] p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-2xl backdrop-saturate-150",
                // Desktop: segmented control in the header
                "md:static md:inline-flex md:h-10 md:w-auto md:rounded-md md:border md:border-border/70 md:bg-foreground/[0.04] md:p-1 md:shadow-none md:backdrop-blur-none",
              )}
            >
              {NAV_ITEMS.map(({ value, label, short, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "flex h-auto flex-col gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium text-muted-foreground",
                    "data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
                    "md:h-8 md:flex-row md:gap-1.5 md:rounded-[5px] md:px-4 md:py-0 md:text-[13px]",
                    "md:data-[state=active]:bg-primary md:data-[state=active]:text-primary-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 md:h-3.5 md:w-3.5" strokeWidth={1.75} />
                  <span className="md:hidden">{short}</span>
                  <span className="hidden md:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {currentUser && <UserMenu user={currentUser} onOpenSettings={() => setActiveTab("users")} />}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7 md:px-8 md:pb-20 md:pt-12">
          {/* ───────────── Pantry ───────────── */}
          <TabsContent value="stock" className="mt-0 space-y-6 md:space-y-8">
            <SectionHeader
              eyebrow={new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              title="Stock"
              action={itemDialog("stock")}
            />

            <div className="glass grid grid-cols-2 overflow-hidden rounded-lg md:grid-cols-4 [&>*]:border-foreground/10 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r md:[&>*:nth-child(-n+2)]:border-b-0 md:[&>*:not(:last-child)]:border-r">
              <Stat label="Items" value={items.length} />
              <Stat label="Por acabarse" value={lowStockCount} tone={lowStockCount > 0 ? "warning" : undefined} />
              <Stat label="Unidades" value={totalQuantity} />
              <Stat label="Categorías" value={categories.length} />
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o ubicación"
                  value={debouncedSearchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDebouncedSearchTerm(e.target.value)
                  }}
                  className="h-12 rounded-md pl-11 pr-11 text-base md:text-sm" // text-base prevents zoom on iOS
                />
                {debouncedSearchTerm && (
                  <button
                    onClick={() => setDebouncedSearchTerm("")}
                    aria-label="Borrar búsqueda"
                    className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {categories.length > 0 && (
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
                  <Chip active={selectedCategoryFilter === null} onClick={() => setSelectedCategoryFilter(null)}>
                    All
                  </Chip>
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      active={selectedCategoryFilter === category.id}
                      onClick={() => setSelectedCategoryFilter(category.id)}
                    >
                      <span className="text-base leading-none">{category.icon}</span>
                      {category.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            <div className="glass overflow-hidden rounded-lg">
              {filteredItems.length === 0 ? (
                <EmptyState
                  icon={<Package className="h-5 w-5" />}
                  title={searchTerm || selectedCategoryFilter ? "Sin resultados" : "Tu stock está vacío"}
                  description={
                    searchTerm || selectedCategoryFilter
                      ? "Probá con otra búsqueda o categoría."
                      : "Agregá tu primer item para empezar a registrar lo que tenés en casa."
                  }
                />
              ) : (
                <ul className="divide-y divide-border/70">
                  {filteredItems.map((item) => {
                    const total = getTotalQuantity(item)
                    const isLow = total <= LOW_STOCK_THRESHOLD
                    const isOpen = expandedItems.has(item.id)
                    return (
                      <li key={item.id}>
                        <Collapsible open={isOpen} onOpenChange={() => toggleItemExpansion(item.id)}>
                          <CollapsibleTrigger asChild>
                            <div
                              role="button"
                              tabIndex={0}
                              className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/40 focus-visible:bg-white/40 dark:hover:bg-white/5 focus-visible:outline-none md:gap-4 md:px-5"
                            >
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-foreground/[0.05] text-xl ring-1 ring-inset ring-foreground/5">
                                {item.category?.icon ?? <Package className="h-4 w-4 text-muted-foreground" />}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-medium">{item.name}</p>
                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                                  {item.category && (
                                    <>
                                      <Dot color={item.category.color} />
                                      <span className="truncate">{item.category.name}</span>
                                      <span aria-hidden>·</span>
                                    </>
                                  )}
                                  <span className="shrink-0">
                                    {item.storageLocations.length}{" "}
                                    {item.storageLocations.length !== 1 ? "ubicaciones" : "ubicación"}
                                  </span>
                                </p>
                              </div>

                              <div className="hidden -space-x-1.5 md:flex">
                                {item.allowedUsers.map((userId) => {
                                  const user = users.find((u) => u.id === userId)
                                  return user ? (
                                    <Avatar key={userId} name={user.name} color={user.color} size="sm" />
                                  ) : null
                                })}
                              </div>

                              <div className="flex w-12 shrink-0 flex-col items-end">
                                <span
                                  className={cn(
                                    "font-display text-[1.75rem] leading-none tabular-nums",
                                    isLow && "text-warning",
                                  )}
                                >
                                  {total}
                                </span>
                                {isLow && (
                                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-warning">
                                    Bajo
                                  </span>
                                )}
                              </div>

                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                  isOpen && "rotate-180",
                                )}
                              />
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down [--radix-accordion-content-height:var(--radix-collapsible-content-height)]">
                            <div className="px-4 pb-4 md:px-5 md:pl-[5.25rem]">
                              <div className="divide-y divide-border/70 rounded-md border border-border/70 bg-white/45 dark:bg-white/5">
                                {item.storageLocations.map((location) => (
                                  <div key={location.id} className="flex items-center justify-between gap-3 py-2 pl-3.5 pr-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      <span className="truncate text-sm">{location.location}</span>
                                    </div>
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
                                  </div>
                                ))}
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">Agregado el {item.addedDate}</p>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      openEditDialog(item)
                                      setIsAddDialogOpen(true)
                                    }}
                                    className="h-9 text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="!size-3.5" /> Editar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="h-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="!size-3.5" /> Borrar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* ───────────── Categories ───────────── */}
          <TabsContent value="categories" className="mt-0">
            <CategoryManager
              categories={categories}
              onCreateCategory={createCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
            />
          </TabsContent>

          {/* ───────────── Shopping list ───────────── */}
          <TabsContent value="shopping" className="mt-0 space-y-6 md:space-y-8">
            <SectionHeader
              eyebrow="Para comprar"
              title="Lista de compras"
              description={
                shoppingList.length
                  ? `${pendingShopping.length} ${pendingShopping.length === 1 ? "pendiente" : "pendientes"} · ${completedShopping.length} en el changuito`
                  : undefined
              }
              action={itemDialog("shopping")}
            />

            {shoppingList.length > 0 && (
              <div className="h-[3px] overflow-hidden rounded-none bg-foreground/10">
                <div
                  className="h-full bg-primary transition-[width] duration-500"
                  style={{ width: `${shoppingProgress}%` }}
                />
              </div>
            )}

            {lowStockCount > 0 && (
              <div className="flex items-center justify-between gap-4 glass rounded-lg border-l-2 !border-l-warning p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {lowStockCount} {lowStockCount === 1 ? "item se está acabando" : "items se están acabando"}
                  </p>
                  <p className="text-xs text-muted-foreground">Agregalos a la lista con un toque.</p>
                </div>
                <Button onClick={addLowStockToShoppingList} variant="outline" size="sm" className="shrink-0">
                  <Plus /> Agregar todos
                </Button>
              </div>
            )}

            {shoppingList.length === 0 ? (
              <div className="glass rounded-lg">
                <EmptyState
                  icon={<ShoppingBasket className="h-5 w-5" />}
                  title="No hay nada para comprar"
                  description="Agregá items a mano o sumá los que se están acabando en tu stock."
                />
              </div>
            ) : (
              <div className="space-y-6">
                {pendingShopping.length > 0 && (
                  <ul className="divide-y divide-border/70 glass overflow-hidden rounded-lg">
                    {pendingShopping.map(renderShoppingRow)}
                  </ul>
                )}
                {completedShopping.length > 0 && (
                  <div className="space-y-2.5">
                    <FieldLabel className="block px-1">En el changuito</FieldLabel>
                    <ul className="divide-y divide-border/70 glass overflow-hidden rounded-lg opacity-80">
                      {completedShopping.map(renderShoppingRow)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ───────────── Household ───────────── */}
          <TabsContent value="users" className="mt-0 space-y-6 md:space-y-8">
            <SectionHeader eyebrow="Grupo familiar" title="Miembros" />

            <div className="grid gap-4 md:grid-cols-5 md:gap-6">
              <div className="space-y-4 md:col-span-2 md:space-y-6">
                {currentUser && (
                  <div className="flex items-center gap-4 glass rounded-lg p-5">
                    <Avatar name={currentUser.name} color={currentUser.color} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-2xl leading-tight">{currentUser.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 glass rounded-lg p-5">
                  <div>
                    <FieldLabel>Clave de acceso</FieldLabel>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Compartí esta clave para que otras personas se unan a tu grupo familiar.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-md border bg-white/45 dark:bg-white/5 p-1 pl-3.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-sm">{accessKey || "—"}</code>
                    <Button
                      onClick={copyAccessKey}
                      variant="ghost"
                      size="icon"
                      aria-label="Copiar clave de acceso"
                      className="h-9 w-9 shrink-0 rounded-lg"
                    >
                      <Copy className="!size-4" />
                    </Button>
                  </div>
                  <Button onClick={regenerateAccessKey} variant="outline" size="sm" className="w-full">
                    <RefreshCw className="!size-3.5" /> Generar nueva clave
                  </Button>
                </div>
              </div>

              <div className="md:col-span-3">
                <ul className="divide-y divide-border/70 glass overflow-hidden rounded-lg">
                  {users.map((user) => {
                    const itemCount = items.filter((item) => item.allowedUsers.includes(user.id)).length
                    const isMe = user.id === currentUser?.id
                    return (
                      <li key={user.id} className="flex items-center gap-3 px-4 py-3.5 md:px-5">
                        <Avatar name={user.name} color={user.color} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-[15px] font-medium">
                            {user.name}
                            {isMe && (
                              <span className="rounded-[4px] bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Vos
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                            {user.email && !isMe ? ` · ${user.email}` : ""}
                          </p>
                        </div>
                        {!isMe && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeUser(user.id)}
                            aria-label={`Quitar a ${user.name}`}
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <UserMinus className="!size-4" />
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </AuthGuard>
  )
}

export default GroceryTracker