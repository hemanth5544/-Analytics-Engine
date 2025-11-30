import request from 'supertest';
import app from '../server.js';

describe('Analytics API Tests', () => {
  const testApiKey = 'test-api-key-for-testing';

  describe('POST /api/analytics/collect', () => {
    it('should reject request without API key', async () => {
      const response = await request(app)
        .post('/api/analytics/collect')
        .send({
          event: 'test_click',
          url: 'https://example.com',
          device: 'mobile',
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with missing required fields', async () => {
      const response = await request(app)
        .post('/api/analytics/collect')
        .set('x-api-key', testApiKey)
        .send({
          event: 'test_click'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/analytics/event-summary', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/event-summary')
        .query({ event: 'click' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/user-stats', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/user-stats')
        .query({ userId: 'test-user' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
    });
  });
});
