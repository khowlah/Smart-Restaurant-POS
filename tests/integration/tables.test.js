import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore } from '../../src/store/inMemoryStore.js';

describe('D: Dining Tables Management Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should retrieve list of dining tables', async () => {
    const res = await request(app)
      .get('/api/tables')
      .set('Authorization', 'Bearer demo-cashier-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('table_number');
    expect(res.body.data[0]).toHaveProperty('status');
  });

  it('should allow cashier to update table status', async () => {
    const tableId = 't0000001-0000-0000-0000-000000000001';
    const res = await request(app)
      .patch(`/api/tables/${tableId}/status`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({ status: 'occupied' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('occupied');
  });

  it('should reject invalid table status', async () => {
    const tableId = 't0000001-0000-0000-0000-000000000001';
    const res = await request(app)
      .patch(`/api/tables/${tableId}/status`)
      .set('Authorization', 'Bearer demo-cashier-token')
      .send({ status: 'invalid_status_xyz' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
