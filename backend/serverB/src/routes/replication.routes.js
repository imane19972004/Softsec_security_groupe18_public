/**
 * Replication Routes
 * 
 * Endpoints pour la synchronisation et la réplication
 * des données entre serveurs
 */

import express from 'express';

export function createReplicationRoutes(replicationController, replicationAuthMiddleware) {
  const router = express.Router();

  router.post(
    '/sync', replicationAuthMiddleware, replicationController.syncHandler
  );

  router.get('/health', replicationController.healthHandler);

  return router;
}

export default createReplicationRoutes;
