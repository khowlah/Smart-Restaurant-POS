import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';
import { AppError } from '../../utils/response.js';

export const createOrder = async (orderData, user) => {
  const { order_type, table_id, customer_name, notes, discount = 0, items } = orderData;

  // Attempt RPC call to PostgreSQL
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
      p_order_type: order_type,
      p_table_id: table_id || null,
      p_customer_name: customer_name || null,
      p_items: items,
      p_notes: notes || null,
      p_discount: discount,
      p_created_by: user.id
    });

    if (!rpcError && rpcResult) {
      return rpcResult;
    }
    if (rpcError && !rpcError.message.includes('fetch failed')) {
      throw new AppError(rpcError.message, 400);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
  }

  // Fallback / In-Memory atomic transaction implementation
  // 1. Concurrency safe table check for dine_in
  let linkedTable = null;
  if (order_type === 'dine_in') {
    if (!table_id) {
      throw new AppError('table_id is required for dine_in orders', 400);
    }
    linkedTable = store.dining_tables.find(t => t.id === table_id);
    if (!linkedTable) {
      throw new AppError(`Dining table with id ${table_id} does not exist`, 404);
    }
    if (linkedTable.status !== 'available') {
      throw new AppError(`Table ${linkedTable.table_number} is currently ${linkedTable.status} and cannot be reserved`, 409);
    }
  }

  // 2. Validate menu items and calculate server-side prices
  let calculatedSubtotal = 0;
  const processedItems = [];

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) {
      throw new AppError('Item quantity must be greater than zero', 400);
    }

    const menuItem = store.menu_items.find(m => m.id === item.menu_item_id);
    if (!menuItem) {
      throw new AppError(`Menu item not found: ${item.menu_item_id}`, 404);
    }
    if (!menuItem.is_available) {
      throw new AppError(`Menu item "${menuItem.name}" is currently unavailable`, 400);
    }

    let unitPrice = menuItem.price;
    if (item.selected_variant?.price !== undefined) {
      unitPrice = item.selected_variant.price;
    }

    let addOnsPrice = 0;
    if (Array.isArray(item.selected_add_ons)) {
      for (const addon of item.selected_add_ons) {
        addOnsPrice += Number(addon.price || 0);
      }
    }

    const itemUnitPrice = Number(unitPrice) + addOnsPrice;
    const itemSubtotal = itemUnitPrice * item.quantity;
    calculatedSubtotal += itemSubtotal;

    processedItems.push({
      id: `oi000001-${Date.now().toString().slice(-10)}-${Math.floor(Math.random() * 1000)}`,
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      unit_price: itemUnitPrice,
      quantity: item.quantity,
      selected_variant: item.selected_variant || null,
      selected_add_ons: item.selected_add_ons || [],
      subtotal: itemSubtotal,
      notes: item.notes || null
    });
  }

  // 3. Compute discount, tax (15%), grand_total
  const safeDiscount = Math.min(Number(discount || 0), calculatedSubtotal);
  const taxableAmount = calculatedSubtotal - safeDiscount;
  const tax = Number((taxableAmount * 0.15).toFixed(2));
  const grandTotal = Number((taxableAmount + tax).toFixed(2));

  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: `ord00001-${Date.now().toString().slice(-12).padStart(12, '0')}`,
    order_number: orderNumber,
    order_type,
    status: 'new',
    table_id: order_type === 'dine_in' ? table_id : null,
    customer_name: customer_name || null,
    subtotal: calculatedSubtotal,
    discount: safeDiscount,
    tax,
    grand_total: grandTotal,
    notes: notes || null,
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 4. Atomic updates
  store.orders.push(newOrder);

  for (const pi of processedItems) {
    store.order_items.push({
      ...pi,
      order_id: newOrder.id,
      created_at: newOrder.created_at
    });
  }

  if (order_type === 'dine_in' && linkedTable) {
    linkedTable.status = 'occupied';
    linkedTable.updated_at = new Date().toISOString();
  }

  return {
    ...newOrder,
    items: processedItems
  };
};

export const getOrderById = async (id) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (!error && order) {
      return order;
    }
  } catch (err) {
    // fallback
  }

  const order = store.orders.find(o => o.id === id);
  if (!order) {
    throw new AppError(`Order not found with id: ${id}`, 404);
  }

  const items = store.order_items.filter(oi => oi.order_id === id);
  return {
    ...order,
    items
  };
};

export const getOrders = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    // fallback
  }

  return store.orders.map(order => ({
    ...order,
    items: store.order_items.filter(oi => oi.order_id === order.id)
  }));
};
