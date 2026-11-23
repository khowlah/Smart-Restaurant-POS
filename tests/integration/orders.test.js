import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore, store } from '../../src/store/inMemoryStore.js';

describe('E: Orders Management & Calculation Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create a valid dine-in order and atomically mark table as occupied', async () => {
    const tableId = 't0000001-0000-0000-0000-000000000001';
    const payload = {
      order_type: 'dine_in',
      table_id: tableId,
      customer_name: 'John Doe',
      items: [
        {
          menu_item_id: 'm0000001-0000-0000-0000-000000000001', // Spanish Latte (22.00)
          quantity: 2,
          selected_add_ons: [{ name: 'Extra Shot', price: 4.00 }] // total item: 26.00 * 2 = 52.00
        }
      ],
      discount: 2.00
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subtotal).toBe(52.00);
    expect(res.body.data.discount).toBe(2.00);
    // Tax: 15% of (52 - 2) = 7.50
    expect(res.body.data.tax).toBe(7.50);
    // Grand Total: (50) + 7.50 = 57.50
    expect(res.body.data.grand_total).toBe(57.50);

    // Verify dining table is now occupied
    const table = store.dining_tables.find(t => t.id === tableId);
    expect(table.status).toBe('occupied');
  });

  it('should prevent duplicate reservation of an already occupied table', async () => {
    const tableId = 't0000001-0000-0000-0000-000000000001';

    // 1st order reserves table
    await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'dine_in',
        table_id: tableId,
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    // 2nd order attempting same table must fail
    const res2 = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'dine_in',
        table_id: tableId,
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toMatch(/cannot be reserved|occupied/i);
  });

  it('should create takeaway and delivery orders without requiring a table', async () => {
    const takeawayRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        customer_name: 'Takeaway Customer',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000002', quantity: 1 }]
      });

    expect(takeawayRes.status).toBe(201);
    expect(takeawayRes.body.data.order_type).toBe('takeaway');

    const deliveryRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'delivery',
        customer_name: 'Delivery Customer',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000002', quantity: 1 }]
      });

    expect(deliveryRes.status).toBe(201);
    expect(deliveryRes.body.data.order_type).toBe('delivery');
  });

  it('should reject order if item is unavailable', async () => {
    // Mark item unavailable
    store.menu_items[0].is_available = false;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: store.menu_items[0].id, quantity: 1 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  it('should reject invalid item quantities (<= 0)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 0 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should recalculate prices on the server and ignore fake client prices', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [
          {
            menu_item_id: 'm0000001-0000-0000-0000-000000000001', // Real price 22.00
            quantity: 1,
            unit_price: 1.00 // Client attempts to cheat!
          }
        ]
      });

    expect(res.status).toBe(201);
    // Subtotal must be real price 22.00, not fake 1.00
    expect(res.body.data.subtotal).toBe(22.00);
    expect(res.body.data.tax).toBe(3.30);
    expect(res.body.data.grand_total).toBe(25.30);
  });
});
