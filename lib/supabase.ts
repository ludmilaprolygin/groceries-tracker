import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          color: string
          access_key: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          access_key: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          access_key?: string
          created_at?: string
        }
      }
      grocery_items: {
        Row: {
          id: string
          name: string
          added_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          added_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          added_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      storage_locations: {
        Row: {
          id: string
          grocery_item_id: string
          location: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grocery_item_id: string
          location: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          grocery_item_id?: string
          location?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      item_permissions: {
        Row: {
          id: string
          grocery_item_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          grocery_item_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          grocery_item_id?: string
          user_id?: string
          created_at?: string
        }
      }
      shopping_list: {
        Row: {
          id: string
          name: string
          quantity: number
          location: string
          is_completed: boolean
          added_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          quantity?: number
          location: string
          is_completed?: boolean
          added_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          location?: string
          is_completed?: boolean
          added_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      access_keys: {
        Row: {
          id: string
          key_value: string
          created_by: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          key_value: string
          created_by?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          key_value?: string
          created_by?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
    }
  }
}
