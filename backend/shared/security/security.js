import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';

/**
 * CSP stricte (ajuste si tu as des CDN).
 * Si ton front est séparé, adapte les directives connect-src / img-src, etc.
 */
export function securityHeaders() {
  return helmet({
    // tu peux désactiver si tu fais du cross-origin embed volontaire
    frameguard: { action: 'deny' },
    contentTypeOptions: true,
    referrerPolicy: { policy: 'no-referrer' },

    // CSP "strict"
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'",config.FRONTEND_ORIGIN], // adapte si ton front appelle un autre domaine
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  });
}

/**
 * Sanitization XSS server-side.
 * -> À appliquer avant stockage / avant renvoi si contenu HTML accepté.
 * Si tes notes sont du texte, tu peux carrément "stripper" tout HTML.
 */
export function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [], // texte pur (recommandé pour notes)
    allowedAttributes: {},
  });
}

/**
 * Validation centralisée (simple et efficace).
 * Si tu veux, on peut remplacer par zod/joi plus tard.
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) schema.body(req.body);
      if (schema.params) schema.params(req.params);
      if (schema.query) schema.query(req.query);
      next();
    } catch (e) {
      res.status(400).json({ error: e.message || 'Invalid input' });
    }
  };
}

/**
 * Limiter brute-force sur endpoints sensibles (login).
 * Par défaut: 5 tentatives / 15 minutes / IP.
 */
export function loginBruteforceLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
  });
}

/**
 * Limiter global (anti-abuse / DoS léger).
 */
export function apiRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 120, // 120 req/min/IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests.' },
  });
}

/**
 * Détection d’activité suspecte (minimal mais utile)
 * - log des accès non autorisés / tokens invalides / etc.
 * Branche-le dans ton errorHandler si possible.
 */
export function logSuspicious(logger) {
  return (req, _res, next) => {
    req._security = { start: Date.now(), flagged: false };

    // exemple: endpoints sensibles
    const sensitive = ['/auth/login', '/auth/register', '/notes'];
    if (sensitive.some(p => req.path.startsWith(p))) {
      // tu peux enrichir ici
    }

    // exposer une petite fonction utilitaire
    req.flagSuspicious = (reason) => {
      req._security.flagged = true;
      req._security.reason = reason;
      if (logger) logger.warn(`[SECURITY] ${reason} - ${req.method} ${req.originalUrl}`);
    };

    next();
  };
}
