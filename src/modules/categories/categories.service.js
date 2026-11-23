import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';
import { AppError } from '../../utils/response.js';

export const getCategories = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      // fallback to store
    }
  }

  return store.categories.filter(c => c.is_active);
};

export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description || null,
        is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
      })
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    // fallback to store
  }

  // Check unique name in store
  const existing = store.categories.find(c => c.name.toLowerCase() === categoryData.name.toLowerCase());
  if (existing) {
    throw new AppError(`Category '${categoryData.name}' already exists`, 400);
  }

  const newCategory = {
    id: `c0000001-${Date.now().toString().slice(-12).padStart(12, '0')}`,
    name: categoryData.name,
    description: categoryData.description || '',
    is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.categories.push(newCategory);
  return newCategory;
};
