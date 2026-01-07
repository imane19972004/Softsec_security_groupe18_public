// backend/shared/services/replicationService.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import fetch from 'node-fetch';
import { logger } from '../config/logger.js';
import { fileURLToPath } from 'url';
/**
 * Service de réplication pour synchroniser les notes entre serveurs
 */
class ReplicationService {
  constructor(peerServerUrl, replicationSecret) {
    this.peerServerUrl = peerServerUrl;
    this.replicationSecret = replicationSecret;
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
   * Répliquer une action vers le serveur pair
   */
  async replicate(entity, action, payload) {
    try {
      const checksum = this.calculateChecksum(payload);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const caCertPath = path.join(__dirname, '../certs/cert.pem');

      const agent = new https.Agent({
        ca: fs.readFileSync(caCertPath)
      });

      const response = await fetch(`${this.peerServerUrl}/replication/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-replication-auth': this.replicationSecret
        },
        body: JSON.stringify({
          entity,
          action,
          payload,
          checksum
        }),
        agent
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Replication failed');
      }

      logger.info(`[Replication] ${entity}:${action}`);
    } catch (err) {
      logger.error(`[Replication] Error ${entity}:${action} - ${err.message}`);
    }
  }

  replicateUserCreate(user) {
    return this.replicate('user', 'create', user);
  }

  replicateNoteCreate(note) {
    return this.replicate('note', 'create', note);
  }
  replicateNoteUpdate(note) {
    return this.replicate('note', 'update', note);
  }
  replicateNoteDelete(note) {
    return this.replicate('note', 'delete', note);
  }

  /**
   * Vérifier la santé du serveur pair
   */
  async checkPeerHealth() {
    try {
      const response = await fetch(`${this.peerServerUrl}/health`);
      
      if (!response.ok) {
        return { healthy: false, error: 'Peer unreachable' };
      }

      const health = await response.json();
      return { healthy: true, data: health };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }
}

export default ReplicationService;