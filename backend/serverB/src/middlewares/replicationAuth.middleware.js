/**
 * Replication Authentication Middleware
 * 
 * Vérifie que les requêtes de réplication viennent du serveur pair
 * autorisé et contiennent les credentials correctes.
 */

import { logger } from '../../../shared/config/logger.js';

export function replicationAuthMiddleware(config) {
  return (req, res, next) => {
    try {
      // Vérifier le header d'authentification
      const authHeader = req.headers['x-replication-auth'];
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Missing replication authentication header',
          header: 'x-replication-auth'
        });
      }

      // Vérifier le secret partagé
      const expectedSecret = config.REPLICATION_SECRET;
      if (!expectedSecret) {
        logger.error('[ReplicationAuth] REPLICATION_SECRET not configured');
        return res.status(500).json({ error: 'Server misconfigured' });
      }

      if (authHeader !== expectedSecret) {
        logger.warn('[ReplicationAuth] Invalid replication credentials attempt');
        return res.status(403).json({ error: 'Invalid replication credentials' });
      }

      // Ajouter des informations au request
      req.isReplicationRequest = true;
      next();
    } catch (err) {
      logger.error('[ReplicationAuth] Error: ' + err.message);
      res.status(500).json({ error: 'Replication authentication failed' });
    }
  };
}

export default replicationAuthMiddleware;
