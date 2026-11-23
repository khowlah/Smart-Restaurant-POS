import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';
import { AppError } from '../../utils/response.js';

export const getTables = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const { data, error } = await supabaseAdmin
        .from('dining_tables')
        .select('*')
        .order('table_number');

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      // fallback
    }
  }

  return [...store.dining_tables].sort((a, b) => a.table_number.localeCompare(b.table_number));
};

export const updateTableStatus = async (id, status) => {
  if (!['available', 'occupied', 'billing_pending'].includes(status)) {
    throw new AppError('Invalid table status', 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('dining_tables')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    // fallback
  }

  const tableIndex = store.dining_tables.findIndex(t => t.id === id);
  if (tableIndex === -1) {
    throw new AppError(`Dining table not found with id: ${id}`, 404);
  }

  store.dining_tables[tableIndex].status = status;
  store.dining_tables[tableIndex].updated_at = new Date().toISOString();
  return store.dining_tables[tableIndex];
};
