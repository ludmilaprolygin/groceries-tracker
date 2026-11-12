-- =====================================================================
-- Grocery Tracker: esquema inicial
-- Migración gestionada por Supabase CLI (local: `npm run db:reset`, prod: `npm run db:push`).
-- Login con Google (Supabase Auth) + access key para unirse al hogar.
-- =====================================================================

-- ---------- Tablas ----------

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'bg-gray-500',
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE storage_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (grocery_item_id, user_id)
);

CREATE TABLE shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  location TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE access_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_value TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Producto elegido en cada supermercado online para cada item de la lista.
CREATE TABLE store_product_choices (
  store TEXT NOT NULL,
  item_key TEXT NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (store, item_key)
);

CREATE INDEX idx_grocery_items_category_id ON grocery_items(category_id);
CREATE INDEX idx_storage_locations_grocery_item_id ON storage_locations(grocery_item_id);
CREATE INDEX idx_item_permissions_grocery_item_id ON item_permissions(grocery_item_id);
CREATE INDEX idx_item_permissions_user_id ON item_permissions(user_id);

-- ---------- Funciones ----------

-- ¿El usuario logueado ya es miembro del hogar?
CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid());
$$;

-- Alta del usuario logueado con Google, validando la access key en el servidor.
CREATE OR REPLACE FUNCTION public.join_household(p_name TEXT, p_color TEXT, p_key TEXT)
RETURNS users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_user users;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM access_keys
    WHERE key_value = trim(p_key) AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RAISE EXCEPTION 'Invalid access key';
  END IF;

  INSERT INTO users (auth_id, name, color, email)
  VALUES (auth.uid(), trim(p_name), p_color, auth.jwt() ->> 'email')
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_household(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_household(TEXT, TEXT, TEXT) TO authenticated;

-- ---------- Row Level Security ----------
-- Solo los miembros (usuarios de Google que se unieron con una access key) ven y modifican datos.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_product_choices ENABLE ROW LEVEL SECURITY;

-- users: cada uno ve su propia fila; los miembros ven a todos.
-- No hay política de INSERT: el alta se hace solo con join_household().
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated
  USING (auth_id = auth.uid() OR public.is_member());
CREATE POLICY "users_update_self" ON users FOR UPDATE TO authenticated
  USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
CREATE POLICY "users_delete_members" ON users FOR DELETE TO authenticated
  USING (public.is_member());

CREATE POLICY "members_all" ON categories FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY "members_all" ON grocery_items FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY "members_all" ON storage_locations FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY "members_all" ON item_permissions FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY "members_all" ON shopping_list FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY "members_all" ON access_keys FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
CREATE POLICY "members_all" ON store_product_choices FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());

-- ---------- Datos iniciales ----------

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
('Pantry', 'bg-amber-500', '🥫');

-- Primera access key (para que el primer usuario pueda unirse).
-- El SQL Editor muestra el valor generado: copialo.
INSERT INTO access_keys (key_value)
VALUES ('GROCERY-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)))
RETURNING key_value;
