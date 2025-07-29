"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

// Add debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export interface User {
  id: string
  name: string
  color: string
  access_key: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface StorageLocation {
  id: string
  location: string
  quantity: number
}

export interface GroceryItem {
  id: string
  name: string
  storageLocations: StorageLocation[]
  allowedUsers: string[]
  addedDate: string
  category?: Category
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  location: string
  isCompleted: boolean
  addedDate: string
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
      toast({ title: "Category created successfully" })
      return data
    } catch (error) {
      toast({ title: "Error creating category", variant: "destructive" })
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
      toast({ title: "Category updated successfully" })
      return data
    } catch (error) {
      toast({ title: "Error updating category", variant: "destructive" })
      throw error
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error

      setCategories((prev) => prev.filter((category) => category.id !== id))
      toast({ title: "Category deleted successfully" })
    } catch (error) {
      toast({ title: "Error deleting category", variant: "destructive" })
      throw error
    }
  }, [])

  // CRUD Operations for Users - wrapped in useCallback to prevent re-renders
  const createUser = useCallback(async (userData: Omit<User, "id">) => {
    try {
      const { data, error } = await supabase.from("users").insert([userData]).select().single()

      if (error) throw error

      setUsers((prev) => [...prev, data])
      toast({ title: "User created successfully" })
      return data
    } catch (error) {
      toast({ title: "Error creating user", variant: "destructive" })
      throw error
    }
  }, [])

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()

      if (error) throw error

      setUsers((prev) => prev.map((user) => (user.id === id ? data : user)))
      toast({ title: "User updated successfully" })
      return data
    } catch (error) {
      toast({ title: "Error updating user", variant: "destructive" })
      throw error
    }
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      setUsers((prev) => prev.filter((user) => user.id !== id))
      toast({ title: "User deleted successfully" })
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" })
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
    }) => {
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

        const { error: permError } = await supabase.from("item_permissions").insert(permissionsData)

        if (permError) throw permError

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
        toast({ title: "Item created successfully" })
        return newItem
      } catch (error) {
        toast({ title: "Error creating item", variant: "destructive" })
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
        toast({ title: "Item updated successfully" })
      } catch (error) {
        toast({ title: "Error updating item", variant: "destructive" })
        throw error
      }
    },
    [categories],
  )

  const deleteGroceryItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("grocery_items").delete().eq("id", id)

      if (error) throw error

      setItems((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Item deleted successfully" })
    } catch (error) {
      toast({ title: "Error deleting item", variant: "destructive" })
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
          },
        ])
        .select()
        .single()

      if (error) throw error

      const newItem: ShoppingItem = {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        location: data.location,
        isCompleted: data.is_completed,
        addedDate: data.added_date,
      }

      setShoppingList((prev) => [...prev, newItem])
      toast({ title: "Shopping item added successfully" })
      return newItem
    } catch (error) {
      toast({ title: "Error adding shopping item", variant: "destructive" })
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      const updatedItem: ShoppingItem = {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        location: data.location,
        isCompleted: data.is_completed,
        addedDate: data.added_date,
      }

      setShoppingList((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
      return updatedItem
    } catch (error) {
      toast({ title: "Error updating shopping item", variant: "destructive" })
      throw error
    }
  }, [])

  const deleteShoppingItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("shopping_list").delete().eq("id", id)

      if (error) throw error

      setShoppingList((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Shopping item deleted successfully" })
    } catch (error) {
      toast({ title: "Error deleting shopping item", variant: "destructive" })
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
      toast({ title: "Error fetching users", variant: "destructive" })
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast({ title: "Error fetching categories", variant: "destructive" })
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
      toast({ title: "Error fetching grocery items", variant: "destructive" })
    }
  }, [])

  const fetchShoppingList = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("shopping_list").select("*").order("created_at", { ascending: false })

      if (error) throw error

      const formattedItems: ShoppingItem[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        location: item.location,
        isCompleted: item.is_completed,
        addedDate: item.added_date,
      }))

      setShoppingList(formattedItems)
    } catch (error) {
      toast({ title: "Error fetching shopping list", variant: "destructive" })
    }
  }, [])

  // Access key operations - wrapped in useCallback
  const validateAccessKey = useCallback(async (key: string) => {
    try {
      const { data, error } = await supabase.from("access_keys").select("*").eq("key_value", key).single()

      if (error) throw error
      return !!data
    } catch (error) {
      return false
    }
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
      toast({ title: "Error generating access key", variant: "destructive" })
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
    validateAccessKey,
    generateAccessKey,

    // Refresh functions
    fetchUsers,
    fetchCategories,
    fetchGroceryItems,
    fetchShoppingList,
  }
}