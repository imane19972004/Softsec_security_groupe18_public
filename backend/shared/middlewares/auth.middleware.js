import { verifyToken } from '../utils/crypto.js';
import { tokenBlacklistService } from '../services/tokenBlacklist.service.js';
import { logger } from '../config/logger.js';

/**
 * Middleware d'authentification avec support cookies HttpOnly
 */
export default function auth(req, res, next) {
  try {
    let token = null;

    // DEBUG: Log all cookies
    logger.info(`[Auth] Cookies received: ${JSON.stringify(req.cookies)}`);
    logger.info(`[Auth] Authorization header: ${req.headers.authorization || 'none'}`);

    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
      logger.info('[Auth] Token found in cookie');
    }
    
    if (!token && req.headers.authorization) {
      const header = req.headers.authorization;
      if (header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
        logger.info('[Auth] Token found in Authorization header');
      }
    }

    // Aucun token trouvé
    if (!token) {
      logger.warn('[Auth] No token provided - rejecting request');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Vérifier si le token est blacklisté
    if (tokenBlacklistService.isBlacklisted(token)) {
      logger.warn('[Auth] Blacklisted token attempted');
      return res.status(401).json({ error: 'Token revoked' });
    }

    // Vérifier et décoder le token
    const decoded = verifyToken(token);
    
    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    // Ajouter le token pour usage ultérieur (logout, refresh)
    req.token = token;

    logger.info(`[Auth] User authenticated: ${decoded.email} (id: ${decoded.id})`);
    next();
  } catch (err) {
    logger.error(`[Auth] Token verification failed: ${err.message}`);
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}

/**
 * Middleware optionnel: authentification non obligatoire
 * Attache l'utilisateur s'il est connecté, mais continue sinon
 */
export function optionalAuth(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    } else if (req.headers.authorization) {
      const header = req.headers.authorization;
      if (header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
      }
    }

    if (token && !tokenBlacklistService.isBlacklisted(token)) {
      try {
        const decoded = verifyToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email
        };
        req.token = token;
      } catch {
        // Token invalide, continuer sans user
      }
    }

    next();
  } catch (err) {
    // En cas d'erreur, continuer sans authentification
    next();
  }
}