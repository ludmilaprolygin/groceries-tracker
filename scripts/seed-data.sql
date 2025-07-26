-- Insert sample user
INSERT INTO users (id, name, color, access_key) VALUES 
('00000000-0000-0000-0000-000000000001', 'You', 'bg-blue-500', 'GROCERY-2024-ABC123')
ON CONFLICT DO NOTHING;

-- Insert sample grocery items
INSERT INTO grocery_items (id, name, added_date) VALUES 
('10000000-0000-0000-0000-000000000001', 'Apples', '2024-01-15'),
('10000000-0000-0000-0000-000000000002', 'Milk', '2024-01-14'),
('10000000-0000-0000-0000-000000000003', 'Bread', '2024-01-13')
ON CONFLICT DO NOTHING;

-- Insert storage locations
INSERT INTO storage_locations (grocery_item_id, location, quantity) VALUES 
('10000000-0000-0000-0000-000000000001', 'Refrigerator', 3),
('10000000-0000-0000-0000-000000000001', 'Counter', 2),
('10000000-0000-0000-0000-000000000001', 'Pantry', 7),
('10000000-0000-0000-0000-000000000002', 'Refrigerator', 2),
('10000000-0000-0000-0000-000000000003', 'Pantry', 1)
ON CONFLICT DO NOTHING;

-- Insert item permissions
INSERT INTO item_permissions (grocery_item_id, user_id) VALUES 
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Insert sample shopping list item
INSERT INTO shopping_list (name, quantity, location, is_completed, added_date) VALUES 
('Bananas', 6, 'Fruit Bowl', false, '2024-01-15')
ON CONFLICT DO NOTHING;
