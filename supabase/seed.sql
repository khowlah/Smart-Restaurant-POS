-- ====================================================================
-- Smart Restaurant & Café POS - Realistic Seed Data
-- Demo accounts, food categories, menu items, variants, add-ons, tables
-- ====================================================================

-- 1. DEMO USERS (Manager, Cashier, Kitchen)
INSERT INTO users (id, email, full_name, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'manager@restaurant.pos', 'Chef Ramsey (Manager)', 'manager'),
    ('22222222-2222-2222-2222-222222222222', 'cashier@restaurant.pos', 'Sarah Jenkins (Cashier)', 'cashier'),
    ('33333333-3333-3333-3333-333333333333', 'kitchen@restaurant.pos', 'Marco Pierre (Head Cook)', 'kitchen')
ON CONFLICT (email) DO NOTHING;

-- 2. FOOD & BEVERAGE CATEGORIES
INSERT INTO categories (id, name, description, is_active) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'Specialty Coffee', 'Artisan espresso, single origin pour-overs and iced coffees', true),
    ('c0000001-0000-0000-0000-000000000002', 'Artisan Burgers', 'Handcrafted brioche burgers grilled to perfection', true),
    ('c0000001-0000-0000-0000-000000000003', 'Wood-Fired Pizza', 'Neapolitan style sourdough pizza with fresh mozzarella', true),
    ('c0000001-0000-0000-0000-000000000004', 'Appetizers & Sides', 'Crispy starters, loaded fries, and fresh salads', true),
    ('c0000001-0000-0000-0000-000000000005', 'Desserts', 'Freshly baked pastries, cheesecakes, and gelato', true),
    ('c0000001-0000-0000-0000-000000000006', 'Refreshing Beverages', 'Fresh mocktails, smoothies, and artisan teas', true)
ON CONFLICT (name) DO NOTHING;

-- 3. MENU ITEMS WITH VARIANTS & ADD-ONS
INSERT INTO menu_items (id, category_id, name, description, price, is_available, image_url, variants, add_ons) VALUES
    (
        'm0000001-0000-0000-0000-000000000001',
        'c0000001-0000-0000-0000-000000000001',
        'Spanish Latte',
        'Rich espresso blended with condensed milk and steamed milk',
        22.00,
        true,
        'https://images.unsplash.com/photo-1541167760496-1628856ab772',
        '[{"name": "Regular (Hot)", "price": 22.00}, {"name": "Iced Large", "price": 25.00}]'::jsonb,
        '[{"name": "Extra Espresso Shot", "price": 4.00}, {"name": "Oat Milk Substitute", "price": 3.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000002',
        'c0000001-0000-0000-0000-000000000001',
        'Flat White',
        'Velvety micro-foam poured over a double ristretto shot',
        18.00,
        true,
        'https://images.unsplash.com/photo-1577968897966-3d4325b36b61',
        '[{"name": "Standard Single Origin", "price": 18.00}]'::jsonb,
        '[{"name": "Almond Milk", "price": 3.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000003',
        'c0000001-0000-0000-0000-000000000002',
        'Truffle Angus Burger',
        'Prime Black Angus beef patty, truffle aioli, melted aged cheddar, caramelized onions on brioche',
        52.00,
        true,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
        '[{"name": "Single Patty", "price": 52.00}, {"name": "Double Patty", "price": 68.00}]'::jsonb,
        '[{"name": "Extra Truffle Sauce", "price": 5.00}, {"name": "Crispy Beef Bacon", "price": 8.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000004',
        'c0000001-0000-0000-0000-000000000002',
        'Crispy Buttermilk Chicken Burger',
        'Crispy fried chicken breast, spicy coleslaw, house pickles, ranch drizzle',
        42.00,
        true,
        'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b',
        '[{"name": "Mild", "price": 42.00}, {"name": "Nashville Hot", "price": 44.00}]'::jsonb,
        '[{"name": "Melted Cheddar Slice", "price": 4.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000005',
        'c0000001-0000-0000-0000-000000000003',
        'Margherita Pizza',
        'San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil leaves, extra virgin olive oil',
        45.00,
        true,
        'https://images.unsplash.com/photo-1604382355076-af4b0eb60143',
        '[{"name": "Medium 10-inch", "price": 45.00}, {"name": "Large 14-inch", "price": 58.00}]'::jsonb,
        '[{"name": "Extra Buffalo Mozzarella", "price": 8.00}, {"name": "Spicy Honey Drizzle", "price": 4.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000006',
        'c0000001-0000-0000-0000-000000000004',
        'Truffle Parmesan Fries',
        'Hand-cut golden fries tossed with white truffle oil, grated parmesan, and fresh parsley',
        24.00,
        true,
        'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
        '[{"name": "Standard Portion", "price": 24.00}]'::jsonb,
        '[{"name": "Ranch Dip", "price": 3.00}, {"name": "Spicy Aioli", "price": 3.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000007',
        'c0000001-0000-0000-0000-000000000005',
        'San Sebastian Cheesecake',
        'Caramelized Basque burnt cheesecake served with warm Belgian milk chocolate ganache',
        34.00,
        true,
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad',
        '[{"name": "Single Slice", "price": 34.00}]'::jsonb,
        '[{"name": "Vanilla Bean Gelato Scoop", "price": 7.00}]'::jsonb
    ),
    (
        'm0000001-0000-0000-0000-000000000008',
        'c0000001-0000-0000-0000-000000000006',
        'Passion Fruit Mojito',
        'Fresh crushed mint, passion fruit puree, lime juice, sparkling soda water',
        26.00,
        true,
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87',
        '[{"name": "Regular Glass", "price": 26.00}]'::jsonb,
        '[]'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 4. DINING TABLES (Indoor & Outdoor restaurant layout)
INSERT INTO dining_tables (id, table_number, capacity, status) VALUES
    ('t0000001-0000-0000-0000-000000000001', 'T-01', 2, 'available'),
    ('t0000001-0000-0000-0000-000000000002', 'T-02', 2, 'available'),
    ('t0000001-0000-0000-0000-000000000003', 'T-03', 4, 'available'),
    ('t0000001-0000-0000-0000-000000000004', 'T-04', 4, 'available'),
    ('t0000001-0000-0000-0000-000000000005', 'T-05', 6, 'available'),
    ('t0000001-0000-0000-0000-000000000006', 'T-06', 6, 'available'),
    ('t0000001-0000-0000-0000-000000000007', 'T-VIP-01', 8, 'available'),
    ('t0000001-0000-0000-0000-000000000008', 'T-OUT-01', 4, 'available')
ON CONFLICT (table_number) DO NOTHING;
