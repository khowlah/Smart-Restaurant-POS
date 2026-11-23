import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore } from '../../src/store/inMemoryStore.js';

describe('H & I: Sales Reports & Full Order Lifecycle Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should execute complete order lifecycle from creation to payment and table release', async () => {
    const tableId = 't0000001-0000-0000-0000-000000000002';

    // 1. Create Dine In Order
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'dine_in',
        table_id: tableId,
        customer_name: 'VIP Customer',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000003', quantity: 2 }]
      });

    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.id;
    const grandTotal = createRes.body.data.grand_total;

    // 2. Kitchen transitions to preparing
    const prepRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', 'Bearer demo-kitchen-token')
      .send({ status: 'preparing' });
    expect(prepRes.status).toBe(200);

    // 3. Kitchen transitions to ready
    const readyRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', 'Bearer demo-kitchen-token')
      .send({ status: 'ready' });
    expect(readyRes.status).toBe(200);

    // 4. Cashier settles payment
    const settleRes = await request(app)
      .post(`/api/orders/${orderId}/settle`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        payment_method: 'card',
        amount: grandTotal
      });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.data.table_released).toBe(true);

    // 5. Check reports summary reflecting today revenue
    const reportRes = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', 'Bearer demo-manager-token');

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.data.total_revenue).toBe(grandTotal);
    expect(reportRes.body.data.total_orders).toBe(1);
    expect(reportRes.body.data.order_breakdown.dine_in).toBe(1);
    expect(reportRes.body.data.top_five_items.length).toBeGreaterThan(0);
    expect(reportRes.body.data.top_five_items[0].total_quantity_sold).toBe(2);
  });
});
