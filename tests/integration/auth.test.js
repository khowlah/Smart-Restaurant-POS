import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetStore } from '../../src/store/inMemoryStore.js';

describe('A & B: Authentication & RBAC Authorization Suite', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Authentication (/api/auth)', () => {
    it('should successfully log in a manager with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager@restaurant.pos', password: 'manager123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('manager');
      expect(res.body.data.user.email).toBe('manager@restaurant.pos');
    });

    it('should successfully log in a cashier with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cashier@restaurant.pos', password: 'cashier123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('cashier');
    });

    it('should successfully log in kitchen staff with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'kitchen@restaurant.pos', password: 'kitchen123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('kitchen');
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager@restaurant.pos', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*credentials/i);
    });

    it('should reject access to protected endpoint when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token missing/i);
    });

    it('should reject access with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve current user profile (/api/auth/me) with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer demo-manager-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('manager@restaurant.pos');
      expect(res.body.data.role).toBe('manager');
    });
  });

  describe('RBAC Authorization Restrictions', () => {
    it('should allow manager to create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', 'Bearer demo-manager-token')
        .send({ name: 'Seasonal Specials', description: 'Limited time offers' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Seasonal Specials');
    });

    it('should forbid cashier from creating a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', 'Bearer demo-cashier-token')
        .send({ name: 'Unauthorized Category' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should forbid kitchen staff from settling a payment', async () => {
      const res = await request(app)
        .post('/api/orders/ord-sample-id/settle')
        .set('Authorization', 'Bearer demo-kitchen-token')
        .send({ payment_method: 'cash', amount: 50 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should forbid cashier from accessing sales reports summary', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', 'Bearer demo-cashier-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow manager to access sales reports summary', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', 'Bearer demo-manager-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_revenue).toBeDefined();
    });
  });
});
