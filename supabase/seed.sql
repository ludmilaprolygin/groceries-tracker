-- Datos de desarrollo: se cargan SOLO en la DB local (`npm run db:reset`).
-- No se aplican en producción.

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

-- Access key fija para unirse al hogar en local.
INSERT INTO access_keys (key_value) VALUES ('GROCERY-LOCALDEV');
