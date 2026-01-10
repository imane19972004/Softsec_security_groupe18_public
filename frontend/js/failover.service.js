/**
 * Service de failover automatique
 * Gère la bascule entre ServerA et ServerB
 */
class FailoverService {
  constructor() {
    this.servers = [
      { url: 'https://localhost:3001', name: 'Server A', priority: 1 },
      { url: 'https://localhost:3002', name: 'Server B', priority: 2 }
    ];
    
    this.currentServer = null;
    this.healthCheckInterval = null;
    this.healthCheckFrequency = 10000; // 10 secondes
    this.failoverAttempts = 0;
    this.maxFailoverAttempts = 3;
    
    // Callbacks pour notifications
    this.onServerChange = null;
    this.onHealthStatusChange = null;
    
    // Initialiser avec le serveur prioritaire
    this.currentServer = this.servers[0];
  }

  /**
   * Démarrer la surveillance de santé
   */
  startHealthChecks() {
    if (this.healthCheckInterval) return;

    console.log('[Failover] Starting health checks');
    
    // Check immédiat
    this.checkCurrentServerHealth();
    
    // Puis checks périodiques
    this.healthCheckInterval = setInterval(() => {
      this.checkCurrentServerHealth();
    }, this.healthCheckFrequency);
  }

  /**
   * Arrêter la surveillance
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[Failover] Stopped health checks');
    }
  }

  /**
   * Vérifier la santé du serveur actuel
   */
  async checkCurrentServerHealth() {
    try {
      const response = await fetch(`${this.currentServer.url}/health`, {
        method: 'GET',
        credentials: 'include' // IMPORTANT: envoyer les cookies
      });

      if (response.ok) {
        console.log(`[Failover] ${this.currentServer.name} is healthy`);
        this.failoverAttempts = 0; // Reset counter on success
        
        if (this.onHealthStatusChange) {
          this.onHealthStatusChange({
            server: this.currentServer,
            healthy: true,
            timestamp: Date.now()
          });
        }
      } else {
        console.warn(`[Failover] ${this.currentServer.name} returned status ${response.status}`);
        await this.attemptFailover();
      }
    } catch (err) {
      console.error(`[Failover] ${this.currentServer.name} health check failed:`, err.message);
      await this.attemptFailover();
    }
  }

  /**
   * Tenter un failover vers le serveur suivant
   */
  async attemptFailover() {
    this.failoverAttempts++;

    if (this.failoverAttempts > this.maxFailoverAttempts) {
      console.error('[Failover] Max failover attempts reached, giving up');
      
      if (this.onHealthStatusChange) {
        this.onHealthStatusChange({
          server: null,
          healthy: false,
          error: 'All servers unreachable',
          timestamp: Date.now()
        });
      }
      return;
    }

    // Trouver le prochain serveur disponible
    const otherServers = this.servers.filter(s => s.url !== this.currentServer.url);
    
    for (const server of otherServers) {
      console.log(`[Failover] Attempting to switch to ${server.name}...`);
      
      const isHealthy = await this.checkServerHealth(server);
      
      if (isHealthy) {
        const previousServer = this.currentServer;
        this.currentServer = server;
        this.failoverAttempts = 0;
        
        console.log(`[Failover] Successfully switched from ${previousServer.name} to ${server.name}`);
        
        if (this.onServerChange) {
          this.onServerChange({
            from: previousServer,
            to: server,
            timestamp: Date.now()
          });
        }
        
        return;
      }
    }

    console.error('[Failover] No healthy server found');
  }

  /**
   * Vérifier la santé d'un serveur spécifique
   */
  async checkServerHealth(server) {
    try {
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        credentials: 'include' // IMPORTANT: envoyer les cookies
      });

      return response.ok;
    } catch (err) {
      console.error(`[Failover] ${server.name} health check failed:`, err.message);
      return false;
    }
  }

  /**
   * Obtenir l'URL du serveur actuel
   */
  getCurrentServerUrl() {
    return this.currentServer ? this.currentServer.url : null;
  }

  /**
   * Obtenir les informations du serveur actuel
   */
  getCurrentServer() {
    return this.currentServer;
  }

  /**
   * Forcer un changement de serveur
   */
  async forceSwitch(serverName) {
    const server = this.servers.find(s => s.name === serverName);
    
    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    const isHealthy = await this.checkServerHealth(server);
    
    if (!isHealthy) {
      throw new Error(`Server ${serverName} is not healthy`);
    }

    const previousServer = this.currentServer;
    this.currentServer = server;
    
    console.log(`[Failover] Manually switched to ${server.name}`);
    
    if (this.onServerChange) {
      this.onServerChange({
        from: previousServer,
        to: server,
        manual: true,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Obtenir le statut de tous les serveurs
   */
  async getAllServersStatus() {
    const statuses = await Promise.all(
      this.servers.map(async (server) => {
        const healthy = await this.checkServerHealth(server);
        return {
          ...server,
          healthy,
          current: server.url === this.currentServer?.url,
          timestamp: Date.now()
        };
      })
    );

    return statuses;
  }

  /**
   * Configuration des callbacks
   */
  setOnServerChange(callback) {
    this.onServerChange = callback;
  }

  setOnHealthStatusChange(callback) {
    this.onHealthStatusChange = callback;
  }
}

// Instance singleton
const failoverService = new FailoverService();

// Démarrer automatiquement les health checks
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    failoverService.startHealthChecks();
  });
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = failoverService;
}

if (typeof window !== 'undefined') {
  window.failoverService = failoverService;
}