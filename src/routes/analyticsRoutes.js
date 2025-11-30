import express from 'express';
import { verifyApiKey } from '../middleware/apiKeyAuth.js';
import { isAuthenticated } from '../middleware/auth.js';
import {
  analyticsCollectionLimiter,
  analyticsQueryLimiter
} from '../middleware/rateLimiter.js';
import {
  collectEvent,
  getEventSummary,
  getUserStats,
  getAnalyticsDashboard
} from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/collect', verifyApiKey, analyticsCollectionLimiter, collectEvent);
router.get('/event-summary', isAuthenticated, analyticsQueryLimiter, getEventSummary);
router.get('/user-stats', isAuthenticated, analyticsQueryLimiter, getUserStats);
router.get('/dashboard', isAuthenticated, analyticsQueryLimiter, getAnalyticsDashboard);

export default router;
