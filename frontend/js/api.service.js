/**
 * Configuration Axios avec support cookies HttpOnly
 * Les cookies sont automatiquement envoyés avec withCredentials: true
 */
const API = axios.create({
  withCredentials: true, // CRITIQUE: envoyer ET recevoir les cookies
  timeout: 10000
});

// Fonction pour obtenir l'URL du serveur actuel
function getCurrentBaseURL() {
  if (typeof window !== 'undefined' && window.failoverService) {
    return window.failoverService.getCurrentServerUrl() || 'https://localhost:3001';
  }
  return 'https://localhost:3001';
}

// Mettre à jour baseURL avant chaque requête
API.interceptors.request.use(config => {
  config.baseURL = getCurrentBaseURL();
  
  const token = getToken();
  if (token && token !== 'cookie-present') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Gestion des erreurs avec retry automatique
API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si la requête a déjà été retry, ne pas réessayer
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si erreur réseau ou timeout → tentative de failover
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('[API] Network error, attempting failover...');
      
      if (typeof window !== 'undefined' && window.failoverService) {
        await window.failoverService.attemptFailover();
        
        // Retry avec le nouveau serveur
        originalRequest._retry = true;
        originalRequest.baseURL = getCurrentBaseURL();
        
        return API(originalRequest);
      }
    }

    // Si 401 (Unauthorized) → rediriger vers login
    if (error.response && error.response.status === 401) {
      // Ne rediriger que si on n'est pas déjà sur la page de login
      if (window.location.pathname !== '/index.html' && 
          window.location.pathname !== '/' && 
          !window.location.pathname.endsWith('register.html')) {
        clearToken();
        window.location.href = 'index.html';
      }
    }

    return Promise.reject(error);
  }
);

// Gestion des événements failover
if (typeof window !== 'undefined' && window.failoverService) {
  window.failoverService.setOnServerChange((event) => {
    showNotification(
      `Connexion basculée vers ${event.to.name}`,
      'warning'
    );
  });

  window.failoverService.setOnHealthStatusChange((status) => {
    if (!status.healthy && status.error) {
      showNotification(
        'Tous les serveurs sont inaccessibles. Veuillez réessayer plus tard.',
        'error'
      );
    }
  });
}

// Fonction utilitaire pour afficher des notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Supprimer après 5 secondes
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Ajouter les animations CSS
if (typeof document !== 'undefined' && !document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}