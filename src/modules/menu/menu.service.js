import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';
import { AppError } from '../../utils/response.js';

export const getMenu = async ({ category, is_available }) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      let query = supabaseAdmin
        .from('menu_items')
        .select('*, categories(id, name)');

      if (is_available !== undefined) {
        const boolVal = is_available === 'true' || is_available === true;
        query = query.eq('is_available', boolVal);
      }

      if (category) {
        query = query.eq('category_id', category);
      }

      const { data, error } = await query.order('name');
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      // fallback to store
    }
  }

  // Fallback to store
  let items = [...store.menu_items];

  if (is_available !== undefined) {
    const boolVal = is_available === 'true' || is_available === true;
    items = items.filter(item => item.is_available === boolVal);
  }

  if (category) {
    items = items.filter(item => item.category_id === category || item.category_name?.toLowerCase() === category.toLowerCase());
  }

  return items.map(item => {
    const cat = store.categories.find(c => c.id === item.category_id);
    return {
      ...item,
      category: cat ? { id: cat.id, name: cat.name } : null
    };
  });
};

export const createMenuItem = async (itemData) => {
  // Validate category existence
  const categoryExists = store.categories.some(c => c.id === itemData.category_id);
  if (!categoryExists) {
    try {
      const { data } = await supabaseAdmin.from('categories').select('id').eq('id', itemData.category_id).single();
      if (!data) throw new AppError('Category does not exist', 400);
    } catch (err) {
      if (err instanceof AppError) throw err;
    }
  }

  if (itemData.price < 0) {
    throw new AppError('Price cannot be negative', 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        category_id: itemData.category_id,
        name: itemData.name,
        description: itemData.description || null,
        price: itemData.price,
        is_available: itemData.is_available !== undefined ? itemData.is_available : true,
        image_url: itemData.image_url || null,
        variants: itemData.variants || [],
        add_ons: itemData.add_ons || []
      })
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    // fallback to store
  }

  const newItem = {
    id: `m0000001-${Date.now().toString().slice(-12).padStart(12, '0')}`,
    category_id: itemData.category_id,
    name: itemData.name,
    description: itemData.description || '',
    price: Number(itemData.price),
    is_available: itemData.is_available !== undefined ? itemData.is_available : true,
    image_url: itemData.image_url || null,
    variants: itemData.variants || [],
    add_ons: itemData.add_ons || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.menu_items.push(newItem);
  return newItem;
};

export const updateAvailability = async (id, is_available) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update({ is_available, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    // fallback
  }

  const itemIndex = store.menu_items.findIndex(i => i.id === id);
  if (itemIndex === -1) {
    throw new AppError(`Menu item not found with id: ${id}`, 404);
  }

  store.menu_items[itemIndex].is_available = is_available;
  store.menu_items[itemIndex].updated_at = new Date().toISOString();
  return store.menu_items[itemIndex];
};
