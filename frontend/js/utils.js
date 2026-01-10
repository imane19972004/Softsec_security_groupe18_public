/**
 * Gestion sécurisée des tokens avec cookies HttpOnly
 * Les cookies HttpOnly sont définis côté serveur
 * On garde un fallback SessionStorage pour debug
 */
const USE_COOKIES = true;

function saveToken(token) {
  // Cookie HttpOnly défini par le serveur, rien à faire côté client, juste pour log
  console.log('[Auth] Token received and stored in HttpOnly cookie');
}

function getToken() {
  const hasCookie = document.cookie.includes('authToken=');
  return hasCookie ? 'authenticated' : null;
}

function clearToken() {
  API.post('/auth/logout')
    .then(() => {
      console.log('[Auth] Logout successful, token cleared from server');
    })
    .catch(err => {
      console.error('[Auth] Error during logout:', err);
    });
}

/**
 * Lire un cookie spécifique
 * Note: Les cookies HttpOnly ne sont PAS accessibles en JS
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

/**
 * Vérifier si l'utilisateur est authentifié
 */
function isAuthenticated() {
  const hasCookie = document.cookie.includes('authToken=');
  
  console.log('[Security] isAuthenticated check:');
  console.log('  - authToken cookie:', hasCookie);
  
  return hasCookie;
}

/**
 * Supprimer le token (déconnexion)
 */
function clearToken() {
  // Supprimer sessionStorage
  sessionStorage.clear();
  console.log('[Security] SessionStorage cleared');
  
  // Le cookie HttpOnly sera supprimé par le serveur via endpoint /logout
  console.log('[Security] Cookie will be cleared by server');
}

/**
 * Déconnexion sécurisée
 */
async function logout() {
  try {
    console.log('[Security] Logging out...');
    
    // Appeler l'endpoint logout pour supprimer le cookie côté serveur
    await API.post('/auth/logout');
    console.log('[Security] Logout successful');
  } catch (err) {
    console.error('[Logout] Error calling logout endpoint:', err);
  } finally {
    // Nettoyer localement
    clearToken();
    console.log('[Security] Redirecting to login page');
    window.location.href = "index.html";
  }
}

/**
 * Sanitization XSS (protection double couche)
 */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validation côté client (avant envoi au serveur)
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // Minimum 8 chars, 1 majuscule, 1 minuscule, 1 chiffre
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Protection CSRF - Générer un token CSRF pour les formulaires
 */
function generateCSRFToken() {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  sessionStorage.setItem('csrfToken', token);
  return token;
}

function getCSRFToken() {
  return sessionStorage.getItem('csrfToken');
}

/**
 * Mesures de sécurité supplémentaires
 */

// Bloquer le drag & drop de fichiers malveillants
if (typeof window !== 'undefined') {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'none';
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
  });

  // Protection contre le clickjacking
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
  
  // Debug: Log cookies au chargement
  console.log('[Security] Page loaded, current cookies:', document.cookie);
}

/**
 * Logging sécurisé (ne jamais logger de tokens ou passwords)
 */
function secureLog(message, data = {}) {
  // Filtrer les données sensibles
  const sanitizedData = { ...data };
  const sensitiveKeys = ['password', 'token', 'authToken', 'secret'];
  
  sensitiveKeys.forEach(key => {
    if (sanitizedData[key]) {
      sanitizedData[key] = '***REDACTED***';
    }
  });

  console.log(`[SecureApp] ${message}`, sanitizedData);
}