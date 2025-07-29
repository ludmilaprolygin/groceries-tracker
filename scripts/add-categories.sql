-- Add categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'bg-gray-500',
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to grocery_items table
ALTER TABLE grocery_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_grocery_items_category_id ON grocery_items(category_id);

-- Insert default categories
INSERT INTO categories (name, color, icon) VALUES 
('Dairy', 'bg-blue-500', '🥛'),
('Meat & Fish', 'bg-red-500', '🥩'),
('Fruits', 'bg-green-500', '🍎'),
('Vegetables', 'bg-emerald-500', '🥕'),
('Pasta & Rice', 'bg-yellow-500', '🍝'),
('Bread & Bakery', 'bg-orange-500', '🍞'),
('Snacks', 'bg-purple-500', '🍿'),
('Beverages', 'bg-cyan-500', '🥤'),
('Cleaning', 'bg-pink-500', '🧽'),
('Personal Care', 'bg-indigo-500', '🧴'),
('Frozen', 'bg-blue-300', '🧊'),
('Pantry', 'bg-amber-500', '🥫')
ON CONFLICT (name) DO NOTHING;