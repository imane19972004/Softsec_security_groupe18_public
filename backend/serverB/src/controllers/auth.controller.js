import createAuthService from '../../../shared/services/auth.service.js';
import ReplicationService from '../../../shared/services/replicationService.js';
import { tokenBlacklistService } from '../../../shared/services/tokenBlacklist.service.js';
import { verifyToken } from '../../../shared/utils/crypto.js';
import config from '../config.js';
import { logger } from '../../../shared/config/logger.js';

const authService = createAuthService(config.DATA_DIR);
const replicationService = new ReplicationService(
  config.PEER_SERVER_URL,
  config.REPLICATION_SECRET,
  config.DATA_DIR,
  'B' // ServerB
);

/**
 * POST /auth/register
 * Inscription avec réplication vers ServerB
 */
async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await authService.register(email, password);

    // Répliquer vers ServerB
    await replicationService.replicateUserCreate({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    });
    
    logger.info(`[ServerA:Auth] User registered: ${email}`);
    res.status(201).json({ email: user.email });
  } catch (err) {
    logger.error(`[ServerA:Auth] Registration error: ${err.message}`);
    next(err);
  }
}

/**
 * POST /auth/login
 * Connexion avec cookie HttpOnly sécurisé
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const token = await authService.login(email, password);
    
    // Définir le cookie HttpOnly sécurisé
    res.cookie('authToken', token, {
      httpOnly: true, // Inaccessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
      sameSite: 'strict', // Protection CSRF
      maxAge: 60 * 60 * 1000 // 1 heure
    });

    logger.info(`[ServerA:Auth] User logged in: ${email}`);
    
    res.json({ 
      token,
      message: 'Login successful',
      server: 'A'
    });
  } catch (err) {
    logger.error(`[ServerA:Auth] Login error: ${err.message}`);
    next(err);
  }
}

/**
 * POST /auth/logout
 * Déconnexion avec blacklist du token
 */
async function logout(req, res, next) {
  try {
    // Récupérer le token depuis le cookie ou header
    const token = req.cookies?.authToken || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (token) {
      try {
        // Décoder le token pour obtenir l'expiration
        const decoded = verifyToken(token);
        
        // Ajouter à la blacklist
        tokenBlacklistService.addToBlacklist(
          token,
          decoded.exp * 1000, // Convertir en ms
          'logout'
        );
        
        logger.info('[ServerA:Auth] Token blacklisted on logout');
      } catch (err) {
        // Token invalide ou expiré, continuer quand même
        logger.warn('[ServerA:Auth] Invalid token on logout:', err.message);
      }
    }

    // Supprimer le cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    logger.info('[ServerA:Auth] User logged out');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error(`[ServerA:Auth] Logout error: ${err.message}`);
    next(err);
  }
}

/**
 * POST /auth/refresh
 * Rafraîchir le token (optionnel)
 */
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Vérifier que le token est valide
    const decoded = verifyToken(token);
    
    // Générer un nouveau token
    const newToken = await authService.refreshToken(decoded.id, decoded.email);
    
    // Blacklister l'ancien token
    tokenBlacklistService.addToBlacklist(
      token,
      decoded.exp * 1000,
      'refresh'
    );
    
    // Définir le nouveau cookie
    res.cookie('authToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    logger.info(`[ServerA:Auth] Token refreshed for user: ${decoded.email}`);
    res.json({ message: 'Token refreshed', token: newToken });
  } catch (err) {
    logger.error(`[ServerA:Auth] Refresh error: ${err.message}`);
    res.status(401).json({ message: 'Invalid token' });
  }
}

export default { register, login, logout, refresh };