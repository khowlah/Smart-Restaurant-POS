import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore, store } from '../../src/store/inMemoryStore.js';

describe('G: Payment Settlement & Concurrency Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should settle payment successfully, complete order, and release dining table', async () => {
    const tableId = 't0000001-0000-0000-0000-000000000001';

    // 1. Create Dine-In order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'dine_in',
        table_id: tableId,
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    const order = orderRes.body.data;
    expect(store.dining_tables.find(t => t.id === tableId).status).toBe('occupied');

    // 2. Settle payment
    const settleRes = await request(app)
      .post(`/api/orders/${order.id}/settle`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        payment_method: 'card',
        amount: order.grand_total,
        transaction_reference: 'AUTH-VISA-9988'
      });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.success).toBe(true);
    expect(settleRes.body.data.status).toBe('completed');
    expect(settleRes.body.data.table_released).toBe(true);

    // 3. Verify dining table is released to available
    expect(store.dining_tables.find(t => t.id === tableId).status).toBe('available');

    // 4. Verify order is completed
    expect(store.orders.find(o => o.id === order.id).status).toBe('completed');
  });

  it('should reject payment with incorrect amount', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    const order = orderRes.body.data;

    const settleRes = await request(app)
      .post(`/api/orders/${order.id}/settle`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        payment_method: 'cash',
        amount: order.grand_total + 10 // wrong amount
      });

    expect(settleRes.status).toBe(400);
    expect(settleRes.body.success).toBe(false);
    expect(settleRes.body.message).toMatch(/does not match order grand total/i);
  });

  it('should prevent duplicate payment settlement for the same order', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    const order = orderRes.body.data;

    // First settlement succeeds
    const firstSettle = await request(app)
      .post(`/api/orders/${order.id}/settle`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        payment_method: 'cash',
        amount: order.grand_total
      });

    expect(firstSettle.status).toBe(200);

    // Second settlement must be rejected
    const secondSettle = await request(app)
      .post(`/api/orders/${order.id}/settle`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        payment_method: 'cash',
        amount: order.grand_total
      });

    expect(secondSettle.status).toBe(409);
    expect(secondSettle.body.success).toBe(false);
    expect(secondSettle.body.message).toMatch(/already been settled/i);
  });
});
