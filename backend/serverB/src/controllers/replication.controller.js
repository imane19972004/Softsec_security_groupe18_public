/**
 * Replication Controller
 * 
 * Gère les endpoints de réplication entre serveurs
 */

import { logger } from '../../../shared/config/logger.js';

export function createReplicationController(replicationService) {
  /**
   * POST /sync
   * Endpoint pour recevoir les actions de réplication
   */
  async function syncHandler(req, res) {
    try {
      const { entity, action, payload, checksum } = req.body;

      const result = await replicationService.handleReplication(entity, action, payload, checksum);

      res.json(result);
    } catch (err) {
      logger.error('[ReplicationController] Sync error: ' + err.message);
      res.status(400).json({
        error: 'Replication failed',
        details: err.message
      });
    }
  }

  /**
   * GET /health
   * Healthcheck pour vérifier que le serveur est opérationnel
   * et prêt à recevoir des réplications
   */
  function healthHandler(req, res) {
    res.json({
      status: 'healthy',
      server: 'B',
      timestamp: new Date().toISOString(),
      ready: true
    });
  }

  return {
    syncHandler,
    healthHandler
  };
}

export default createReplicationController;
