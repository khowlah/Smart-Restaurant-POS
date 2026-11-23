// In-memory data store matching supabase/seed.sql
// Used for high-speed, isolated unit and integration testing, and offline fallback

export const createInitialStore = () => ({
  users: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'manager@restaurant.pos',
      full_name: 'Chef Ramsey (Manager)',
      role: 'manager',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'cashier@restaurant.pos',
      full_name: 'Sarah Jenkins (Cashier)',
      role: 'cashier',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'kitchen@restaurant.pos',
      full_name: 'Marco Pierre (Head Cook)',
      role: 'kitchen',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  categories: [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      name: 'Specialty Coffee',
      description: 'Artisan espresso, single origin pour-overs and iced coffees',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'c0000001-0000-0000-0000-000000000002',
      name: 'Artisan Burgers',
      description: 'Handcrafted brioche burgers grilled to perfection',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'c0000001-0000-0000-0000-000000000003',
      name: 'Wood-Fired Pizza',
      description: 'Neapolitan style sourdough pizza with fresh mozzarella',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'c0000001-0000-0000-0000-000000000004',
      name: 'Appetizers & Sides',
      description: 'Crispy starters, loaded fries, and fresh salads',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'c0000001-0000-0000-0000-000000000005',
      name: 'Desserts',
      description: 'Freshly baked pastries, cheesecakes, and gelato',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'c0000001-0000-0000-0000-000000000006',
      name: 'Refreshing Beverages',
      description: 'Fresh mocktails, smoothies, and artisan teas',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  menu_items: [
    {
      id: 'm0000001-0000-0000-0000-000000000001',
      category_id: 'c0000001-0000-0000-0000-000000000001',
      name: 'Spanish Latte',
      description: 'Rich espresso blended with condensed milk and steamed milk',
      price: 22.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772',
      variants: [{ name: 'Regular (Hot)', price: 22.00 }, { name: 'Iced Large', price: 25.00 }],
      add_ons: [{ name: 'Extra Espresso Shot', price: 4.00 }, { name: 'Oat Milk Substitute', price: 3.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000002',
      category_id: 'c0000001-0000-0000-0000-000000000001',
      name: 'Flat White',
      description: 'Velvety micro-foam poured over a double ristretto shot',
      price: 18.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61',
      variants: [{ name: 'Standard Single Origin', price: 18.00 }],
      add_ons: [{ name: 'Almond Milk', price: 3.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000003',
      category_id: 'c0000001-0000-0000-0000-000000000002',
      name: 'Truffle Angus Burger',
      description: 'Prime Black Angus beef patty, truffle aioli, melted aged cheddar, caramelized onions on brioche',
      price: 52.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      variants: [{ name: 'Single Patty', price: 52.00 }, { name: 'Double Patty', price: 68.00 }],
      add_ons: [{ name: 'Extra Truffle Sauce', price: 5.00 }, { name: 'Crispy Beef Bacon', price: 8.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000004',
      category_id: 'c0000001-0000-0000-0000-000000000002',
      name: 'Crispy Buttermilk Chicken Burger',
      description: 'Crispy fried chicken breast, spicy coleslaw, house pickles, ranch drizzle',
      price: 42.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b',
      variants: [{ name: 'Mild', price: 42.00 }, { name: 'Nashville Hot', price: 44.00 }],
      add_ons: [{ name: 'Melted Cheddar Slice', price: 4.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000005',
      category_id: 'c0000001-0000-0000-0000-000000000003',
      name: 'Margherita Pizza',
      description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil leaves, extra virgin olive oil',
      price: 45.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143',
      variants: [{ name: 'Medium 10-inch', price: 45.00 }, { name: 'Large 14-inch', price: 58.00 }],
      add_ons: [{ name: 'Extra Buffalo Mozzarella', price: 8.00 }, { name: 'Spicy Honey Drizzle', price: 4.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000006',
      category_id: 'c0000001-0000-0000-0000-000000000004',
      name: 'Truffle Parmesan Fries',
      description: 'Hand-cut golden fries tossed with white truffle oil, grated parmesan, and fresh parsley',
      price: 24.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
      variants: [{ name: 'Standard Portion', price: 24.00 }],
      add_ons: [{ name: 'Ranch Dip', price: 3.00 }, { name: 'Spicy Aioli', price: 3.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000007',
      category_id: 'c0000001-0000-0000-0000-000000000005',
      name: 'San Sebastian Cheesecake',
      description: 'Caramelized Basque burnt cheesecake served with warm Belgian milk chocolate ganache',
      price: 34.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad',
      variants: [{ name: 'Single Slice', price: 34.00 }],
      add_ons: [{ name: 'Vanilla Bean Gelato Scoop', price: 7.00 }],
      created_at: new Date().toISOString()
    },
    {
      id: 'm0000001-0000-0000-0000-000000000008',
      category_id: 'c0000001-0000-0000-0000-000000000006',
      name: 'Passion Fruit Mojito',
      description: 'Fresh crushed mint, passion fruit puree, lime juice, sparkling soda water',
      price: 26.00,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87',
      variants: [{ name: 'Regular Glass', price: 26.00 }],
      add_ons: [],
      created_at: new Date().toISOString()
    }
  ],
  dining_tables: [
    { id: 't0000001-0000-0000-0000-000000000001', table_number: 'T-01', capacity: 2, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000002', table_number: 'T-02', capacity: 2, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000003', table_number: 'T-03', capacity: 4, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000004', table_number: 'T-04', capacity: 4, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000005', table_number: 'T-05', capacity: 6, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000006', table_number: 'T-06', capacity: 6, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000007', table_number: 'T-VIP-01', capacity: 8, status: 'available', created_at: new Date().toISOString() },
    { id: 't0000001-0000-0000-0000-000000000008', table_number: 'T-OUT-01', capacity: 4, status: 'available', created_at: new Date().toISOString() }
  ],
  orders: [],
  order_items: [],
  payments: []
});

export let store = createInitialStore();

export const resetStore = () => {
  store = createInitialStore();
  return store;
};
