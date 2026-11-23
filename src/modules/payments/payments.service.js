import { supabaseAdmin } from '../../config/supabase.js';
import { store } from '../../store/inMemoryStore.js';
import { AppError } from '../../utils/response.js';

export const settlePayment = async (orderId, paymentData, user) => {
  const { payment_method, amount, transaction_reference } = paymentData;

  // Supabase RPC transactional settlement
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('settle_payment_atomic', {
      p_order_id: orderId,
      p_payment_method: payment_method,
      p_amount: amount,
      p_settled_by: user.id,
      p_transaction_ref: transaction_reference || null
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

  // Fallback atomic settlement logic
  const orderIndex = store.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new AppError(`Order not found with id: ${orderId}`, 404);
  }

  const order = store.orders[orderIndex];

  if (order.status === 'cancelled') {
    throw new AppError(`Cannot settle cancelled order ${order.order_number}`, 400);
  }

  // Check duplicate settlement
  const existingPayment = store.payments.find(p => p.order_id === orderId && p.status === 'completed');
  if (existingPayment) {
    throw new AppError(`Order ${order.order_number} has already been settled`, 409);
  }

  // Validate payment amount equals order grand total
  const diff = Math.abs(Number(amount) - Number(order.grand_total));
  if (diff > 0.01) {
    throw new AppError(`Payment amount ${amount} does not match order grand total ${order.grand_total}`, 400);
  }

  // Atomic state change
  const paymentRecord = {
    id: `pay00001-${Date.now().toString().slice(-12).padStart(12, '0')}`,
    order_id: order.id,
    payment_method,
    amount: Number(amount),
    status: 'completed',
    transaction_reference: transaction_reference || `TXN-${Date.now()}`,
    settled_by: user.id,
    settled_at: new Date().toISOString()
  };

  store.payments.push(paymentRecord);

  // Mark order completed
  order.status = 'completed';
  order.updated_at = new Date().toISOString();

  // Release table if dine_in
  let tableReleased = false;
  if (order.table_id) {
    const table = store.dining_tables.find(t => t.id === order.table_id);
    if (table) {
      table.status = 'available';
      table.updated_at = new Date().toISOString();
      tableReleased = true;
    }
  }

  return {
    payment_id: paymentRecord.id,
    order_id: order.id,
    order_number: order.order_number,
    payment_method: paymentRecord.payment_method,
    amount: paymentRecord.amount,
    status: paymentRecord.status,
    settled_at: paymentRecord.settled_at,
    order_status: 'completed',
    table_released: tableReleased
  };
};
