// backend/serverB/src/services/replication.service.js (MODIFIÉ)

/**
 * Replication Service
 * 
 * Gère la réplication des données entre les serveurs
 * (création, mise à jour, suppression de notes / users)
 */

import crypto from 'crypto';
import { logger } from '../../../shared/config/logger.js';

export function createReplicationService(noteService, userService) {

  function calculateChecksum(payload) {
    const data = JSON.stringify(payload);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async function handleReplication(entity, action, payload, checksum) {
    logger.info(
      `[Replication] Incoming request | entity=${entity} action=${action}`
    );

    if (!entity || !action || !payload) {
      logger.warn('[Replication] Invalid payload received');
      throw new Error('Invalid replication payload');
    }

    const calculated = calculateChecksum(payload);

    if (checksum && calculated !== checksum) {
      logger.error(
        `[Replication] Checksum mismatch | entity=${entity} action=${action}`
      );
      throw new Error('Checksum mismatch');
    }

    try {
      switch (entity) {
        case 'note':
          logger.info(
            `[Replication] Note replication | action=${action} id=${payload.id}`
          );

          if (action === 'create') noteService.replicateCreate(payload);
          else if (action === 'update') noteService.replicateUpdate(payload);
          else if (action === 'delete') noteService.replicateDelete(payload);
          else {
            logger.warn(
              `[Replication] Unsupported note action: ${action}`
            );
            throw new Error(`Unsupported action: ${action}`);
          }
          break;

        case 'user':
          logger.info(
            `[Replication] User replication | action=${action} email=${payload.email}`
          );

          // ✅ Support pour user create ET update
          if (action === 'create') {
            userService.replicateCreate(payload);
          } else if (action === 'update') {
            // ✅ NOUVEAU: Gestion de la mise à jour utilisateur
            userService.replicateUpdate(payload);
          } else {
            logger.warn(
              `[Replication] Unsupported user action: ${action}`
            );
            throw new Error(`Unsupported user action: ${action}`);
          }
          break;

        default:
          logger.error(
            `[Replication] Unknown entity received: ${entity}`
          );
          throw new Error(`Unknown entity: ${entity}`);
      }

      logger.info(
        `[Replication] SUCCESS | entity=${entity} action=${action}`
      );

      return { success: true };

    } catch (err) {
      logger.error(
        `[Replication] FAILURE | entity=${entity} action=${action} | ${err.message}`
      );
      throw err;
    }
  }

  return {
    calculateChecksum,
    handleReplication
  };
}

export default createReplicationService;