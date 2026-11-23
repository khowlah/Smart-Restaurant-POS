import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';

export const getSalesReportSummary = async (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

  // Try RPC call in PostgreSQL
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('get_sales_report_summary', {
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString()
    });

    if (!rpcError && rpcResult) {
      return rpcResult;
    }
  } catch (err) {
    // fallback
  }

  // Fallback calculation from settled payments and completed orders
  const settledPayments = store.payments.filter(p => {
    const pDate = new Date(p.settled_at);
    return p.status === 'completed' && pDate >= start && pDate <= end;
  });

  const totalRevenue = Number(settledPayments.reduce((acc, p) => acc + Number(p.amount), 0).toFixed(2));

  // Orders created in period
  const periodOrders = store.orders.filter(o => {
    const oDate = new Date(o.created_at);
    return oDate >= start && oDate <= end;
  });

  const totalOrders = periodOrders.length;
  const dineInCount = periodOrders.filter(o => o.order_type === 'dine_in').length;
  const takeawayCount = periodOrders.filter(o => o.order_type === 'takeaway').length;
  const deliveryCount = periodOrders.filter(o => o.order_type === 'delivery').length;

  // Top 5 best selling items from non-cancelled orders in period
  const itemMap = new Map();
  const validOrderIds = new Set(periodOrders.filter(o => o.status !== 'cancelled').map(o => o.id));

  for (const oi of store.order_items) {
    if (validOrderIds.has(oi.order_id)) {
      const existing = itemMap.get(oi.menu_item_id) || {
        menu_item_id: oi.menu_item_id,
        item_name: oi.item_name,
        total_quantity_sold: 0,
        total_sales: 0
      };
      existing.total_quantity_sold += oi.quantity;
      existing.total_sales = Number((existing.total_sales + Number(oi.subtotal)).toFixed(2));
      itemMap.set(oi.menu_item_id, existing);
    }
  }

  const topFiveItems = Array.from(itemMap.values())
    .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
    .slice(0, 5);

  return {
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    order_breakdown: {
      dine_in: dineInCount,
      takeaway: takeawayCount,
      delivery: deliveryCount
    },
    top_five_items: topFiveItems
  };
};
