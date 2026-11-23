import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore } from '../../src/store/inMemoryStore.js';

describe('C: Menu & Category Management Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should retrieve list of menu items', async () => {
    const res = await request(app).get('/api/menu');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should filter menu items by availability', async () => {
    const res = await request(app).get('/api/menu?is_available=true');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach(item => {
      expect(item.is_available).toBe(true);
    });
  });

  it('should filter menu items by category', async () => {
    const categoryId = 'c0000001-0000-0000-0000-000000000001';
    const res = await request(app).get(`/api/menu?category=${categoryId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach(item => {
      expect(item.category_id).toBe(categoryId);
    });
  });

  it('should allow manager to create a new menu item', async () => {
    const newItem = {
      category_id: 'c0000001-0000-0000-0000-000000000001',
      name: 'Caramel Macchiato',
      description: 'Fresh espresso, vanilla syrup and caramel drizzle',
      price: 24.50,
      is_available: true,
      variants: [{ name: 'Medium', price: 24.50 }, { name: 'Large', price: 28.00 }],
      add_ons: [{ name: 'Extra Caramel', price: 3.00 }]
    };

    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer demo-manager-token')
      .send(newItem);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Caramel Macchiato');
    expect(res.body.data.price).toBe(24.50);
  });

  it('should reject creating menu item with negative price', async () => {
    const invalidItem = {
      category_id: 'c0000001-0000-0000-0000-000000000001',
      name: 'Invalid Item',
      price: -10.00
    };

    const res = await request(app)
      .post('/api/menu')
      .set('Authorization', 'Bearer demo-manager-token')
      .send(invalidItem);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow manager to toggle item availability', async () => {
    const itemId = 'm0000001-0000-0000-0000-000000000001';
    const res = await request(app)
      .patch(`/api/menu/${itemId}/availability`)
      .set('Authorization', 'Bearer demo-manager-token')
      .send({ is_available: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_available).toBe(false);
  });
});
