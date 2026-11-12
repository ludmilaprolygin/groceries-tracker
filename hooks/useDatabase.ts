"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

import type { User, Category, GroceryItem, ShoppingItem } from "@/lib/types"

export type { User, Category, StorageLocation, GroceryItem, ShoppingItem } from "@/lib/types"

/** Optional flags for operations triggered indirectly (e.g. by the shopping list), which report on their own. */
interface OpOptions {
  silent?: boolean
}

function toShoppingItem(row: any): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    location: row.location,
    isCompleted: row.is_completed,
    addedDate: row.added_date,
    categoryId: row.category_id ?? null,
    groceryItemId: row.grocery_item_id ?? null,
    stockedLocation: row.stocked_location ?? null,
  }
}

export function useDatabase() {
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<GroceryItem[]>([])
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  // Memoize the data to prevent unnecessary re-renders
  const memoizedUsers = useMemo(() => users, [users])
  const memoizedCategories = useMemo(() => categories, [categories])
  const memoizedItems = useMemo(() => items, [items])
  const memoizedShoppingList = useMemo(() => shoppingList, [shoppingList])

  // CRUD Operations for Categories
  const createCategory = useCallback(async (categoryData: Omit<Category, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("categories").insert([categoryData]).select().single()

      if (error) throw error

      setCategories((prev) => [...prev, data])
      toast({ title: "Categoría creada" })
      return data
    } catch (error) {
      toast({ title: "Error al crear la categoría", variant: "destructive" })
      throw error
    }
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setCategories((prev) => prev.map((category) => (category.id === id ? data : category)))
      toast({ title: "Categoría actualizada" })
      return data
    } catch (error) {
      toast({ title: "Error al actualizar la categoría", variant: "destructive" })
      throw error
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error

      setCategories((prev) => prev.filter((category) => category.id !== id))
      toast({ title: "Categoría eliminada" })
    } catch (error) {
      toast({ title: "Error al eliminar la categoría", variant: "destructive" })
      throw error
    }
  }, [])

  // CRUD Operations for Users - wrapped in useCallback to prevent re-renders
  const createUser = useCallback(async (userData: Omit<User, "id">) => {
    try {
      const { data, error } = await supabase.from("users").insert([userData]).select().single()

      if (error) throw error

      setUsers((prev) => [...prev, data])
      toast({ title: "Usuario creado" })
      return data
    } catch (error) {
      toast({ title: "Error al crear el usuario", variant: "destructive" })
      throw error
    }
  }, [])

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()

      if (error) throw error

      setUsers((prev) => prev.map((user) => (user.id === id ? data : user)))
      toast({ title: "Usuario actualizado" })
      return data
    } catch (error) {
      toast({ title: "Error al actualizar el usuario", variant: "destructive" })
      throw error
    }
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      setUsers((prev) => prev.filter((user) => user.id !== id))
      toast({ title: "Usuario eliminado" })
    } catch (error) {
      toast({ title: "Error al eliminar el usuario", variant: "destructive" })
      throw error
    }
  }, [])

  // CRUD Operations for Grocery Items - wrapped in useCallback
  const createGroceryItem = useCallback(
    async (itemData: {
      name: string
      storageLocations: { location: string; quantity: number }[]
      allowedUsers: string[]
      categoryId?: string
    }, options: OpOptions = {}) => {
      try {
        // Create the grocery item
        const { data: item, error: itemError } = await supabase
          .from("grocery_items")
          .insert([{ name: itemData.name, category_id: itemData.categoryId }])
          .select()
          .single()

        if (itemError) throw itemError

        // Create storage locations
        const storageLocationsData = itemData.storageLocations.map((loc) => ({
          grocery_item_id: item.id,
          location: loc.location,
          quantity: loc.quantity,
        }))

        const { data: locations, error: locError } = await supabase
          .from("storage_locations")
          .insert(storageLocationsData)
          .select()

        if (locError) throw locError

        // Create permissions
        const permissionsData = itemData.allowedUsers.map((userId) => ({
          grocery_item_id: item.id,
          user_id: userId,
        }))

        if (permissionsData.length > 0) {
          const { error: permError } = await supabase.from("item_permissions").insert(permissionsData)
          if (permError) throw permError
        }

        // Get category info if provided
        let category = undefined
        if (itemData.categoryId) {
          category = categories.find((cat) => cat.id === itemData.categoryId)
        }

        const newItem: GroceryItem = {
          id: item.id,
          name: item.name,
          storageLocations: locations.map((loc) => ({
            id: loc.id,
            location: loc.location,
            quantity: loc.quantity,
          })),
          allowedUsers: itemData.allowedUsers,
          addedDate: item.added_date,
          category,
        }

        setItems((prev) => [...prev, newItem])
        if (!options.silent) toast({ title: "Item agregado" })
        return newItem
      } catch (error) {
        toast({ title: "Error al agregar el item", variant: "destructive" })
        throw error
      }
    },
    [categories],
  )

  const updateGroceryItem = useCallback(
    async (
      id: string,
      updates: {
        name?: string
        storageLocations?: { location: string; quantity: number }[]
        allowedUsers?: string[]
        categoryId?: string
      },
      options: OpOptions = {},
    ) => {
      try {
        // Update the grocery item name and category if provided
        if (updates.name !== undefined || updates.categoryId !== undefined) {
          const updateData: any = { updated_at: new Date().toISOString() }
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId

          const { error: itemError } = await supabase.from("grocery_items").update(updateData).eq("id", id)

          if (itemError) throw itemError
        }

        // Update storage locations if provided
        if (updates.storageLocations) {
          // Delete existing locations
          await supabase.from("storage_locations").delete().eq("grocery_item_id", id)

          // Insert new locations
          const storageLocationsData = updates.storageLocations.map((loc) => ({
            grocery_item_id: id,
            location: loc.location,
            quantity: loc.quantity,
          }))

          await supabase.from("storage_locations").insert(storageLocationsData)
        }

        // Update permissions if provided
        if (updates.allowedUsers) {
          // Delete existing permissions
          await supabase.from("item_permissions").delete().eq("grocery_item_id", id)

          // Insert new permissions
          const permissionsData = updates.allowedUsers.map((userId) => ({
            grocery_item_id: id,
            user_id: userId,
          }))

          await supabase.from("item_permissions").insert(permissionsData)
        }

        // Refresh the item
        await fetchGroceryItems()
        if (!options.silent) toast({ title: "Item actualizado" })
      } catch (error) {
        toast({ title: "Error al actualizar el item", variant: "destructive" })
        throw error
      }
    },
    [categories],
  )

  const deleteGroceryItem = useCallback(async (id: string, options: OpOptions = {}) => {
    try {
      const { error } = await supabase.from("grocery_items").delete().eq("id", id)

      if (error) throw error

      setItems((prev) => prev.filter((item) => item.id !== id))
      if (!options.silent) toast({ title: "Item eliminado" })
    } catch (error) {
      toast({ title: "Error al eliminar el item", variant: "destructive" })
      throw error
    }
  }, [])

  // CRUD Operations for Shopping List - wrapped in useCallback
  const createShoppingItem = useCallback(async (itemData: Omit<ShoppingItem, "id">) => {
    try {
      const { data, error } = await supabase
        .from("shopping_list")
        .insert([
          {
            name: itemData.name,
            quantity: itemData.quantity,
            location: itemData.location,
            is_completed: itemData.isCompleted,
            category_id: itemData.categoryId ?? null,
            grocery_item_id: itemData.groceryItemId ?? null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      const newItem = toShoppingItem(data)

      setShoppingList((prev) => [...prev, newItem])
      toast({ title: "Agregado a la lista de compras" })
      return newItem
    } catch (error) {
      toast({ title: "Error al agregar a la lista de compras", variant: "destructive" })
      throw error
    }
  }, [])

  const updateShoppingItem = useCallback(async (id: string, updates: Partial<ShoppingItem>) => {
    try {
      const { data, error } = await supabase
        .from("shopping_list")
        .update({
          name: updates.name,
          quantity: updates.quantity,
          location: updates.location,
          is_completed: updates.isCompleted,
          category_id: updates.categoryId,
          grocery_item_id: updates.groceryItemId,
          stocked_location: updates.stockedLocation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      const updatedItem = toShoppingItem(data)

      setShoppingList((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
      return updatedItem
    } catch (error) {
      toast({ title: "Error al actualizar la lista de compras", variant: "destructive" })
      throw error
    }
  }, [])

  const deleteShoppingItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("shopping_list").delete().eq("id", id)

      if (error) throw error

      setShoppingList((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Quitado de la lista de compras" })
    } catch (error) {
      toast({ title: "Error al quitar de la lista de compras", variant: "destructive" })
      throw error
    }
  }, [])

  // Fetch functions - wrapped in useCallback
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      toast({ title: "Error al cargar los usuarios", variant: "destructive" })
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast({ title: "Error al cargar las categorías", variant: "destructive" })
    }
  }, [])

  const fetchGroceryItems = useCallback(async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from("grocery_items")
        .select(`
          *,
          storage_locations (*),
          item_permissions (user_id),
          categories (*)
        `)
        .order("created_at", { ascending: false })

      if (itemsError) throw itemsError

      const formattedItems: GroceryItem[] = (items || []).map((item) => ({
        id: item.id,
        name: item.name,
        storageLocations: item.storage_locations.map((loc: any) => ({
          id: loc.id,
          location: loc.location,
          quantity: loc.quantity,
        })),
        allowedUsers: item.item_permissions.map((perm: any) => perm.user_id),
        addedDate: item.added_date,
        category: item.categories || undefined,
      }))

      setItems(formattedItems)
    } catch (error) {
      toast({ title: "Error al cargar el stock", variant: "destructive" })
    }
  }, [])

  const fetchShoppingList = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("shopping_list").select("*").order("created_at", { ascending: false })

      if (error) throw error

      const formattedItems: ShoppingItem[] = (data || []).map(toShoppingItem)

      setShoppingList(formattedItems)
    } catch (error) {
      toast({ title: "Error al cargar la lista de compras", variant: "destructive" })
    }
  }, [])

  // Access key operations - wrapped in useCallback
  const fetchLatestAccessKey = useCallback(async () => {
    const { data } = await supabase
      .from("access_keys")
      .select("key_value")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.key_value ?? ""
  }, [])

  const generateAccessKey = useCallback(async () => {
    try {
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      const newKey = `GROCERY-${timestamp}-${random}`

      const { data, error } = await supabase
        .from("access_keys")
        .insert([{ key_value: newKey }])
        .select()
        .single()

      if (error) throw error
      return newKey
    } catch (error) {
      toast({ title: "Error al generar la clave de acceso", variant: "destructive" })
      throw error
    }
  }, [])

  // Initialize data - only run once
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchUsers(), fetchCategories(), fetchGroceryItems(), fetchShoppingList()])
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [fetchUsers, fetchCategories, fetchGroceryItems, fetchShoppingList])

  return {
    // Data - use memoized versions
    users: memoizedUsers,
    categories: memoizedCategories,
    items: memoizedItems,
    shoppingList: memoizedShoppingList,
    loading,

    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,

    // User operations
    createUser,
    updateUser,
    deleteUser,

    // Grocery item operations
    createGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,

    // Shopping list operations
    createShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,

    // Access key operations
    generateAccessKey,
    fetchLatestAccessKey,

    // Refresh functions
    fetchUsers,
    fetchCategories,
    fetchGroceryItems,
    fetchShoppingList,
  }
}