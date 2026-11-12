export interface User {
  id: string
  name: string
  color: string
  auth_id: string | null
  email: string | null
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
  categoryId?: string | null
  /** Stock item this entry refers to, when known. */
  groceryItemId?: string | null
  /** Stock location where the purchase was added; null while it hasn't been added to stock. */
  stockedLocation?: string | null
}
