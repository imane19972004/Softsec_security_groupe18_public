// backend/serverB/src/routes/auth.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../../../shared/validators/index.js';

const router = express.Router();

// Rate limiter pour login (protection brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: "Too many login attempts, please try again later."
});

/**
 * POST /auth/register
 * Créer un nouveau compte utilisateur sur ServerB
 */
router.post('/register', validateRegister, authController.register);

/**
 * POST /auth/login
 * Se connecter sur ServerB (failover)
 */
router.post('/login', loginLimiter, validateLogin, authController.login);

/**
 * POST /auth/logout
 * Se déconnecter (blacklist token)
 */
router.post('/logout', authController.logout);

export default router;