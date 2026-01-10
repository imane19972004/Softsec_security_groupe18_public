// backend/shared/services/replicationQueue.js
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

/**
 * Queue de réplication persistante avec retry exponential backoff
 * Gère les opérations de réplication qui échouent et les rejoue automatiquement
 */
class ReplicationQueue {
  constructor(dataDir, maxRetries = 5, initialDelayMs = 1000) {
    this.queueDir = path.join(dataDir, 'replication-queue');
    this.maxRetries = maxRetries;
    this.initialDelayMs = initialDelayMs;
    this.processing = false;
    this.processingInterval = null;
    
    // Créer le dossier de queue s'il n'existe pas
    this.ensureQueueDir();
  }

  ensureQueueDir() {
    if (!fs.existsSync(this.queueDir)) {
      fs.mkdirSync(this.queueDir, { recursive: true });
      logger.info('[ReplicationQueue] Queue directory created');
    }
  }

  /**
   * Ajouter une opération à la queue
   */
  async enqueue(entity, action, payload, targetServer) {
    try {
      const id = crypto.randomUUID();
      const queueItem = {
        id,
        entity,
        action,
        payload,
        targetServer,
        attempts: 0,
        maxRetries: this.maxRetries,
        createdAt: Date.now(),
        nextRetryAt: Date.now(),
        lastError: null,
        checksum: this.calculateChecksum(payload)
      };

      const filePath = path.join(this.queueDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(queueItem, null, 2));
      
      logger.info(`[ReplicationQueue] Enqueued ${entity}:${action} (id: ${id})`);
      return id;
    } catch (err) {
      logger.error(`[ReplicationQueue] Failed to enqueue: ${err.message}`);
      throw err;
    }
  }

  /**
   * Récupérer tous les items de la queue prêts à être traités
   */
  getPendingItems() {
    try {
      if (!fs.existsSync(this.queueDir)) return [];
      
      const files = fs.readdirSync(this.queueDir).filter(f => f.endsWith('.json'));
      const now = Date.now();
      
      return files
        .map(file => {
          try {
            const content = fs.readFileSync(path.join(this.queueDir, file), 'utf-8');
            return JSON.parse(content);
          } catch {
            return null;
          }
        })
        .filter(item => item && item.nextRetryAt <= now && item.attempts < item.maxRetries);
    } catch (err) {
      logger.error(`[ReplicationQueue] Error reading queue: ${err.message}`);
      return [];
    }
  }

  /**
   * Marquer un item comme réussi et le supprimer
   */
  async markSuccess(id) {
    try {
      const filePath = path.join(this.queueDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`[ReplicationQueue] Item ${id} completed successfully`);
      }
    } catch (err) {
      logger.error(`[ReplicationQueue] Failed to mark success: ${err.message}`);
    }
  }

  /**
   * Marquer un item comme échoué et programmer le prochain retry
   */
  async markFailure(id, error) {
    try {
      const filePath = path.join(this.queueDir, `${id}.json`);
      if (!fs.existsSync(filePath)) return;

      const item = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      item.attempts += 1;
      item.lastError = error.message;
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
      const delayMs = this.initialDelayMs * Math.pow(2, item.attempts - 1);
      item.nextRetryAt = Date.now() + delayMs;

      if (item.attempts >= item.maxRetries) {
        logger.error(`[ReplicationQueue] Item ${id} exceeded max retries, moving to dead letter queue`);
        this.moveToDeadLetter(item);
        fs.unlinkSync(filePath);
      } else {
        fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
        logger.warn(`[ReplicationQueue] Item ${id} failed (attempt ${item.attempts}/${item.maxRetries}), retry in ${delayMs}ms`);
      }
    } catch (err) {
      logger.error(`[ReplicationQueue] Failed to mark failure: ${err.message}`);
    }
  }

  /**
   * Déplacer vers dead letter queue (échecs définitifs)
   */
  moveToDeadLetter(item) {
    try {
      const dlqDir = path.join(this.queueDir, 'dead-letter');
      if (!fs.existsSync(dlqDir)) {
        fs.mkdirSync(dlqDir, { recursive: true });
      }
      
      const dlqPath = path.join(dlqDir, `${item.id}.json`);
      item.failedAt = Date.now();
      fs.writeFileSync(dlqPath, JSON.stringify(item, null, 2));
      
      logger.error(`[ReplicationQueue] Item ${item.id} moved to dead letter queue`);
    } catch (err) {
      logger.error(`[ReplicationQueue] Failed to move to DLQ: ${err.message}`);
    }
  }

  /**
   * Calculer checksum pour vérification intégrité
   */
  calculateChecksum(payload) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Démarrer le traitement automatique de la queue
   */
  startProcessing(replicationService, intervalMs = 5000) {
    if (this.processing) {
      logger.warn('[ReplicationQueue] Already processing');
      return;
    }

    this.processing = true;
    logger.info(`[ReplicationQueue] Started processing (interval: ${intervalMs}ms)`);

    this.processingInterval = setInterval(async () => {
      const pendingItems = this.getPendingItems();
      
      if (pendingItems.length === 0) return;

      logger.info(`[ReplicationQueue] Processing ${pendingItems.length} pending items`);

      for (const item of pendingItems) {
        try {
          await replicationService.replicateDirect(
            item.entity,
            item.action,
            item.payload,
            item.targetServer,
            item.checksum
          );
          
          await this.markSuccess(item.id);
        } catch (err) {
          await this.markFailure(item.id, err);
        }
      }
    }, intervalMs);
  }

  /**
   * Arrêter le traitement automatique
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.processing = false;
      logger.info('[ReplicationQueue] Stopped processing');
    }
  }

  /**
   * Obtenir statistiques de la queue
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.queueDir).filter(f => f.endsWith('.json'));
      const items = files.map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(this.queueDir, f), 'utf-8'));
        } catch {
          return null;
        }
      }).filter(Boolean);

      const dlqDir = path.join(this.queueDir, 'dead-letter');
      const dlqCount = fs.existsSync(dlqDir) 
        ? fs.readdirSync(dlqDir).filter(f => f.endsWith('.json')).length 
        : 0;

      return {
        pending: items.length,
        failed: dlqCount,
        oldestItem: items.length > 0 
          ? Math.min(...items.map(i => i.createdAt))
          : null,
        averageAttempts: items.length > 0
          ? items.reduce((sum, i) => sum + i.attempts, 0) / items.length
          : 0
      };
    } catch (err) {
      logger.error(`[ReplicationQueue] Error getting stats: ${err.message}`);
      return { pending: 0, failed: 0, oldestItem: null, averageAttempts: 0 };
    }
  }

  /**
   * Nettoyer les items trop anciens (> 7 jours)
   */
  cleanup(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = fs.readdirSync(this.queueDir).filter(f => f.endsWith('.json'));
      const now = Date.now();
      let cleaned = 0;

      files.forEach(file => {
        const filePath = path.join(this.queueDir, file);
        try {
          const item = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (now - item.createdAt > maxAgeMs) {
            this.moveToDeadLetter(item);
            fs.unlinkSync(filePath);
            cleaned++;
          }
        } catch {
          // Fichier corrompu, supprimer
          fs.unlinkSync(filePath);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        logger.info(`[ReplicationQueue] Cleaned up ${cleaned} old items`);
      }

      return cleaned;
    } catch (err) {
      logger.error(`[ReplicationQueue] Cleanup error: ${err.message}`);
      return 0;
    }
  }
}

export default ReplicationQueue;