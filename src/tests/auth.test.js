import request from 'supertest';
import app from '../server.js';

describe('Auth API Tests', () => {
  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .redirects(0);

      expect([302, 401]).toContain(response.status);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test App',
          domain: 'https://test.com'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/api-key', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/api-key')
        .query({ app_id: 'test-app-id' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/revoke', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/revoke')
        .send({ api_key: 'test-key' });

      expect(response.status).toBe(401);
    });
  });
});
