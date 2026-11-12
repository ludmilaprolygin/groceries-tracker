-- Vincula cada item de la lista de compras con el stock:
--   category_id      categoría elegida al agregarlo a la lista
--   grocery_item_id  item del stock al que corresponde (si ya existe o una vez comprado)
--   stocked_location ubicación del stock donde se sumó la compra; NULL = todavía no se sumó.
--                    Permite deshacer la suma si se desmarca el item.

ALTER TABLE shopping_list
  ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE SET NULL,
  ADD COLUMN stocked_location TEXT;
