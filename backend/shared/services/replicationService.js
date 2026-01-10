// backend/shared/services/replicationService.js (MISE À JOUR)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import fetch from 'node-fetch';
import { logger } from '../config/logger.js';
import { fileURLToPath } from 'url';
import ReplicationQueue from './replicationQueue.js';

/**
 * Service de réplication bidirectionnelle avec gestion de queue
 */
class ReplicationService {
  constructor(peerServerUrl, replicationSecret, dataDir, serverName = 'A') {
    this.peerServerUrl = peerServerUrl;
    this.replicationSecret = replicationSecret;
    this.serverName = serverName;
    this.dataDir = dataDir;
    
    // Initialiser la queue de réplication
    this.queue = new ReplicationQueue(dataDir);
    
    // Cache pour éviter les boucles infinies de réplication
    this.recentlyProcessed = new Set();
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Calculer le checksum pour vérifier l'intégrité
   */
  calculateChecksum(payload) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Générer un ID unique pour éviter les boucles
   */
  generateOperationId(entity, action, payload) {
    const data = `${entity}:${action}:${JSON.stringify(payload)}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Vérifier si l'opération a été récemment traitée
   */
  isRecentlyProcessed(operationId) {
    return this.recentlyProcessed.has(operationId);
  }

  /**
   * Marquer une opération comme traitée
   */
  markAsProcessed(operationId) {
    this.recentlyProcessed.add(operationId);
    
    // Auto-cleanup après timeout
    setTimeout(() => {
      this.recentlyProcessed.delete(operationId);
    }, this.cacheTimeout);
  }

  /**
   * Réplication directe (tentative immédiate)
   */
  async replicateDirect(entity, action, payload, targetUrl = null, checksum = null) {
    const target = targetUrl || this.peerServerUrl;
    
    try {
      // Ajouter metadata serveur source
      const enrichedPayload = {
        ...payload,
        _sourceServer: this.serverName,
        _timestamp: Date.now()
      };

      const calculatedChecksum = checksum || this.calculateChecksum(enrichedPayload);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const caCertPath = path.join(__dirname, '../certs/cert.pem');

      let agent = null;
      if (target.startsWith('https://') && fs.existsSync(caCertPath)) {
        agent = new https.Agent({
          ca: fs.readFileSync(caCertPath),
          rejectUnauthorized: false // Pour dev seulement
        });
      }

      const response = await fetch(`${target}/replication/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-replication-auth': this.replicationSecret,
          'x-source-server': this.serverName
        },
        body: JSON.stringify({
          entity,
          action,
          payload: enrichedPayload,
          checksum: calculatedChecksum
        }),
        agent,
        timeout: 5000 // 5s timeout
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Replication failed');
      }

      logger.info(`[Replication:${this.serverName}] SUCCESS ${entity}:${action} → ${target}`);
      return await response.json();
    } catch (err) {
      logger.error(`[Replication:${this.serverName}] FAILED ${entity}:${action} → ${target}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Réplication avec queue (failsafe)
   */
  async replicate(entity, action, payload) {
    // Générer ID d'opération
    const operationId = this.generateOperationId(entity, action, payload);
    
    // Éviter les boucles: ne pas répliquer si reçu du pair
    if (payload._sourceServer && payload._sourceServer !== this.serverName) {
      logger.info(`[Replication:${this.serverName}] Skipping loop prevention: ${entity}:${action}`);
      return;
    }

    try {
      // Tentative immédiate
      await this.replicateDirect(entity, action, payload);
    } catch (err) {
      // En cas d'échec, ajouter à la queue
      logger.warn(`[Replication:${this.serverName}] Direct replication failed, enqueueing: ${err.message}`);
      await this.queue.enqueue(entity, action, payload, this.peerServerUrl);
    }
  }

  /**
   * Démarrer le traitement automatique de la queue
   */
  startQueueProcessing(intervalMs = 5000) {
    this.queue.startProcessing(this, intervalMs);
    logger.info(`[Replication:${this.serverName}] Queue processing started`);
  }

  /**
   * Arrêter le traitement de la queue
   */
  stopQueueProcessing() {
    this.queue.stopProcessing();
    logger.info(`[Replication:${this.serverName}] Queue processing stopped`);
  }

  /**
   * Méthodes de réplication par entité
   */
  async replicateUserCreate(user) {
    return this.replicate('user', 'create', user);
  }

  // ✅ NOUVEAU: Réplication des mises à jour utilisateur (partages)
  async replicateUserUpdate(user) {
    return this.replicate('user', 'update', {
      id: user.id,
      email: user.email,
      myNotes: user.myNotes || [],
      notesSharedWithMe: user.notesSharedWithMe || [],
      createdAt: user.createdAt instanceof Date 
        ? user.createdAt.toISOString() 
        : user.createdAt
    });
  }

  async replicateNoteCreate(note) {
    return this.replicate('note', 'create', note);
  }

  async replicateNoteUpdate(note) {
    return this.replicate('note', 'update', note);
  }

  async replicateNoteDelete(note) {
    return this.replicate('note', 'delete', note);
  }

  /**
   * Vérifier la santé du serveur pair
   */
  async checkPeerHealth() {
    try {
      const response = await fetch(`${this.peerServerUrl}/replication/health`, {
        timeout: 3000
      });
      
      if (!response.ok) {
        return { healthy: false, error: 'Peer unreachable', status: response.status };
      }

      const health = await response.json();
      return { healthy: true, data: health };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }

  /**
   * Obtenir les statistiques de réplication
   */
  getStats() {
    const queueStats = this.queue.getStats();
    
    return {
      serverName: this.serverName,
      peerUrl: this.peerServerUrl,
      queue: queueStats,
      recentlyProcessedCount: this.recentlyProcessed.size
    };
  }

  /**
   * Forcer la resynchronisation complète (DANGEREUX)
   */
  async forceSyncAll(noteService, userService) {
    logger.warn(`[Replication:${this.serverName}] Force sync initiated`);
    
    try {
      // Sync tous les utilisateurs
      const users = userService.getAllUsers ? userService.getAllUsers() : [];
      for (const user of users) {
        await this.replicateUserCreate(user);
      }

      // Sync toutes les notes
      const notes = noteService.getAllNotes ? noteService.getAllNotes() : [];
      for (const note of notes) {
        await this.replicateNoteCreate(note);
      }

      logger.info(`[Replication:${this.serverName}] Force sync completed: ${users.length} users, ${notes.length} notes`);
    } catch (err) {
      logger.error(`[Replication:${this.serverName}] Force sync failed: ${err.message}`);
      throw err;
    }
  }
}

export default ReplicationService;