// backend/shared/services/replicationService.js
import crypto from 'crypto';

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
  calculateChecksum(note) {
    const data = JSON.stringify({
      id: note.id,
      ownerId: note.ownerId,
      title: note.title,
      content: note.content,
      updatedAt: note.updatedAt
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Envoyer une action de réplication au serveur pair
   * 
   * @param {string} action - 'create', 'update', ou 'delete'
   * @param {object} note - Objet note à répliquer
   */
  async replicate(action, note) {
    try {
      // Calculer le checksum pour l'intégrité
      const checksum = this.calculateChecksum(note);

      // Préparer la requête
      const response = await fetch(`${this.peerServerUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Replication-Auth': this.replicationSecret
        },
        body: JSON.stringify({
          action,
          note,
          checksum
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Replication failed: ${error.error}`);
      }

      const result = await response.json();
      console.log(` Replicated ${action} to peer server:`, note.id);
      
      return result;
    } catch (err) {
      console.error(` Replication error (${action}):`, err.message);
      // Ne pas bloquer l'opération principale si la réplication échoue
      // En production, on pourrait mettre en queue pour réessayer
      return { success: false, error: err.message };
    }
  }

  /**
   * Répliquer une création de note
   */
  async replicateCreate(note) {
    return this.replicate('create', note);
  }

  /**
   * Répliquer une mise à jour de note
   */
  async replicateUpdate(note) {
    return this.replicate('update', note);
  }

  /**
   * Répliquer une suppression de note
  */
  async replicateDelete(note) {
    return this.replicate('delete', note);
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