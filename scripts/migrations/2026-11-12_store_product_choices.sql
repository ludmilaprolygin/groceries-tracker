-- Producto elegido en cada supermercado online para cada item de la lista de compras.
-- Ejecutar una vez en Supabase → SQL Editor (ya incluido en schema.sql para bases nuevas).

CREATE TABLE store_product_choices (
  store TEXT NOT NULL,              -- 'masonline'
  item_key TEXT NOT NULL,           -- nombre normalizado del item ("leche entera")
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (store, item_key)
);

ALTER TABLE store_product_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all" ON store_product_choices FOR ALL TO authenticated
  USING (public.is_member()) WITH CHECK (public.is_member());
