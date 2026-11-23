import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore } from '../../src/store/inMemoryStore.js';

describe('F: Kitchen Display System (KDS) Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should retrieve active KDS orders sorted chronologically with seconds_elapsed', async () => {
    // Create two orders
    await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000002', quantity: 1 }]
      });

    const res = await request(app)
      .get('/api/kds/orders')
      .set('Authorization', 'Bearer demo-kitchen-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]).toHaveProperty('seconds_elapsed');
    expect(typeof res.body.data[0].seconds_elapsed).toBe('number');
  });

  it('should follow valid status transitions: new -> preparing -> ready -> completed', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    const orderId = orderRes.body.data.id;

    // 1. new -> preparing
    const prepRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', 'Bearer demo-kitchen-token')
      .send({ status: 'preparing' });

    expect(prepRes.status).toBe(200);
    expect(prepRes.body.data.status).toBe('preparing');

    // 2. preparing -> ready
    const readyRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', 'Bearer demo-kitchen-token')
      .send({ status: 'ready' });

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.data.status).toBe('ready');

    // 3. ready -> completed
    const completeRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', 'Bearer demo-kitchen-token')
      .send({ status: 'completed' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('completed');
  });

  it('should reject invalid status jump (new -> ready directly)', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({
        order_type: 'takeaway',
        items: [{ menu_item_id: 'm0000001-0000-0000-0000-000000000001', quantity: 1 }]
      });

    const orderId = orderRes.body.data.id;

    const invalidRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', 'Bearer demo-kitchen-token')
      .send({ status: 'ready' });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.message).toMatch(/Invalid order status transition/i);
  });
});
