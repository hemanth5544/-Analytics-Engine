import express from 'express';
import passport from '../config/passport.js';
import { isAuthenticated } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerApp,
  getApiKey,
  revokeApiKey,
  regenerateApiKey,
  getUserApps,
  getCurrentUser,
  logout
} from '../controllers/authController.js';

const router = express.Router();

router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  authLimiter,
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
  (req, res) => {
    res.redirect('/api/auth/success');
  }
);

router.get('/success', (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      message: 'Authentication successful',
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    });
  }
  return res.status(401).json({ error: 'Not authenticated' });
});

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

router.get('/me', isAuthenticated, getCurrentUser);
router.post('/logout', isAuthenticated, logout);
router.post('/register', isAuthenticated, authLimiter, registerApp);
router.get('/api-key', isAuthenticated, getApiKey);
router.post('/revoke', isAuthenticated, authLimiter, revokeApiKey);
router.post('/regenerate', isAuthenticated, authLimiter, regenerateApiKey);
router.get('/apps', isAuthenticated, getUserApps);

export default router;
