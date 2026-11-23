import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';
import { AppError } from '../../utils/response.js';

export const getActiveKdsOrders = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .in('status', ['new', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const now = Date.now();
        return data.map(order => ({
          ...order,
          seconds_elapsed: Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 1000))
        }));
      }
    } catch (err) {
      // fallback
    }
  }

  const now = Date.now();
  const activeOrders = store.orders
    .filter(o => ['new', 'preparing', 'ready'].includes(o.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(order => {
      const items = store.order_items.filter(oi => oi.order_id === order.id);
      const seconds_elapsed = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 1000));
      return {
        ...order,
        items,
        seconds_elapsed
      };
    });

  return activeOrders;
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('update_order_status_atomic', {
      p_order_id: orderId,
      p_new_status: newStatus
    });

    if (!error && data) {
      return data;
    }
    if (error && !error.message.includes('fetch failed')) {
      throw new AppError(error.message, 400);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
  }

  // In-memory state machine validation
  const orderIndex = store.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new AppError(`Order not found with id: ${orderId}`, 404);
  }

  const currentOrder = store.orders[orderIndex];
  const currentStatus = currentOrder.status;

  // Strict valid state transitions
  const validTransitions = {
    new: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed'],
    completed: [],
    cancelled: []
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid order status transition from '${currentStatus}' to '${newStatus}'. Allowed next statuses: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
      400
    );
  }

  // If cancelling and attached to table, release table
  if (newStatus === 'cancelled' && currentOrder.table_id) {
    const table = store.dining_tables.find(t => t.id === currentOrder.table_id);
    if (table) {
      table.status = 'available';
      table.updated_at = new Date().toISOString();
    }
  }

  currentOrder.status = newStatus;
  currentOrder.updated_at = new Date().toISOString();

  return {
    id: currentOrder.id,
    order_number: currentOrder.order_number,
    status: currentOrder.status,
    updated_at: currentOrder.updated_at
  };
};
