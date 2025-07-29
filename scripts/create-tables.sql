-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  access_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery_items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage_locations table
CREATE TABLE IF NOT EXISTS storage_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create item_permissions table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS item_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(grocery_item_id, user_id)
);

-- Create shopping_list table
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  location TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access_keys table
CREATE TABLE IF NOT EXISTS access_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_value TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_locations_grocery_item_id ON storage_locations(grocery_item_id);
CREATE INDEX IF NOT EXISTS idx_item_permissions_grocery_item_id ON item_permissions(grocery_item_id);
CREATE INDEX IF NOT EXISTS idx_item_permissions_user_id ON item_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_access_keys_key_value ON access_keys(key_value);