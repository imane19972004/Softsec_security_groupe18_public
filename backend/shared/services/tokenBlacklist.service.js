/**
 * Token Blacklist Service
 * 
 * Gère une liste noire de tokens JWT pour empêcher leur réutilisation
 * après déconnexion ou révocation. Utilise une implémentation en mémoire
 * avec expiration automatique basée sur le TTL du token.
 * 
 * IMPORTANT: Pour une production avec plusieurs instances,
 * utiliser Redis ou une base de données.
 */

import { logger } from '../config/index.js';

export class TokenBlacklistService {
  constructor() {
    // Map: token -> { expiresAt, revokedAt, reason }
    this.blacklist = new Map();
    this.cleanupInterval = null;
  }

 

  /**
   * Ajouter un token à la liste noire
   * @param {string} token - Le token JWT à blacklister
   * @param {number} expiresAt - Timestamp d'expiration du token
   * @param {string} reason - Raison de la révocation (logout, revoked, etc.)
   */
  addToBlacklist(token, expiresAt, reason = 'logout') {
    this.blacklist.set(token, {
      revokedAt: Date.now(),
      expiresAt,
      reason
    });
  }

  /**
   * Vérifier si un token est blacklisté
   * @param {string} token - Le token JWT à vérifier
   * @returns {boolean} true si le token est blacklisté
   */
  isBlacklisted(token) {
    return this.blacklist.has(token);
  }

  /**
   * Obtenir les détails d'un token blacklisté
   * @param {string} token - Le token JWT
   * @returns {Object|null} Les détails ou null si pas blacklisté
   */
  getBlacklistEntry(token) {
    return this.blacklist.get(token) || null;
  }

  /**
   * Retirer un token de la liste noire (rarement utilisé)
   * @param {string} token - Le token JWT
   */
  removeFromBlacklist(token) {
    this.blacklist.delete(token);
  }

  /**
   * Nettoyer les tokens expirés (exécuté périodiquement)
   * @returns {number} Nombre de tokens supprimés
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, entry] of this.blacklist.entries()) {
      if (entry.expiresAt < now) {
        this.blacklist.delete(token);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Démarrer le nettoyage automatique
   * @param {number} intervalMs - Intervalle de nettoyage en ms (défaut: 1 heure)
   */
  startAutoCleanup(intervalMs = 60 * 60 * 1000) {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanupExpiredTokens();
      if (cleaned > 0) {
        logger.info(`[TokenBlacklist] Cleaned up ${cleaned} expired tokens`);
      }
    }, intervalMs);

    logger.info(`[TokenBlacklist] Auto-cleanup started (interval: ${intervalMs}ms)`);
  }

  /**
   * Arrêter le nettoyage automatique
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('[TokenBlacklist] Auto-cleanup stopped');
    }
  }

  /**
   * Obtenir les statistiques de la blacklist
   * @returns {Object} Stats: count, expiredCount, memoryUsage
   */
  getStats() {
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.blacklist.values()) {
      if (entry.expiresAt < now) {
        expiredCount++;
      }
    }

    return {
      totalBlacklisted: this.blacklist.size,
      expiredTokens: expiredCount,
      activeTokens: this.blacklist.size - expiredCount,
      memoryUsage: Buffer.byteLength(JSON.stringify(Array.from(this.blacklist)))
    };
  }

  /**
   * Vider complètement la blacklist (généralement utilisé en test)
   */
  clear() {
    this.blacklist.clear();
  }
}

// Instance singleton
export const tokenBlacklistService = new TokenBlacklistService();

export default tokenBlacklistService;
