// Server B - Application Entry Point

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import dotenv from 'dotenv';
import crypto from 'crypto';

import authRoutes from '../../serverA/src/routes/auth.routes.js';
import notesRoutes from '../../serverA/src/routes/notes.routes.js';
import noteService from '../../shared/services/noteService.js';

dotenv.config();

const app = express();

// Configuration pour Server B
const config = {
  PORT: process.env.PORT_B || 3002,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 100,
  DATA_DIR: './data_serverB',
  // Secret partagé pour l'authentification inter-serveurs
  REPLICATION_SECRET: process.env.REPLICATION_SECRET || 'shared-secret-change-in-production',
  // URL de l'autre serveur
  PEER_SERVER_URL: process.env.PEER_SERVER_URL || 'http://localhost:3001'
};

// Middlewares de sécurité
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '30kb' }));
app.use(hpp());
app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX
  })
);

// Routes standards (identiques à Server A)
app.get('/', (req, res) => {
  res.send('Server B - Secure Notes API (Replica)');
});
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// ============================================
// ENDPOINT DE RÉPLICATION
// ============================================

/**
 * Middleware d'authentification inter-serveurs
 * Vérifie que la requête vient bien de l'autre serveur
 */
function authenticateReplication(req, res, next) {
  try {
    const authHeader = req.headers['x-replication-auth'];
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing replication authentication' });
    }

    // Vérifier le secret partagé
    if (authHeader !== config.REPLICATION_SECRET) {
      return res.status(403).json({ error: 'Invalid replication credentials' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Replication authentication failed' });
  }
}

/**
 * Calculer le checksum d'une note pour vérifier l'intégrité
 */
function calculateChecksum(note) {
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
 * ENDPOINT: POST /sync
 * Reçoit les données de réplication du serveur pair
 * 
 * Body attendu:
 * {
 *   "action": "create" | "update" | "delete",
 *   "note": { ... },
 *   "checksum": "hash_sha256"
 * }
 */
app.post('/sync', authenticateReplication, async (req, res) => {
  try {
    const { action, note, checksum } = req.body;

    // Validation basique
    if (!action || !note) {
      return res.status(400).json({ error: 'Missing action or note data' });
    }

    // Vérification d'intégrité avec checksum
    if (checksum) {
      const calculatedChecksum = calculateChecksum(note);
      if (calculatedChecksum !== checksum) {
        console.error(' Checksum mismatch - potential data corruption');
        return res.status(400).json({ error: 'Integrity check failed' });
      }
    }

    // Exécuter l'action de réplication
    switch (action) {
      case 'create':
        // Créer la note sur ce serveur
        noteService.createNote(
          config.DATA_DIR,
          note.ownerId,
          note.id,
          note.title,
          note.content
        );
        console.log(` Replicated CREATE: ${note.id}`);
        break;

      case 'update':
        // Mettre à jour la note
        noteService.updateNote(
          config.DATA_DIR,
          note.ownerId,
          note.id,
          note.content
        );
        console.log(` Replicated UPDATE: ${note.id}`);
        break;

      case 'delete':
        // Supprimer la note
        noteService.deleteNote(
          config.DATA_DIR,
          note.ownerId,
          note.id
        );
        console.log(`Replicated DELETE: ${note.id}`);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ 
      success: true, 
      message: `Replication ${action} completed`,
      checksum: checksum 
    });

  } catch (err) {
    console.error(' Replication error:', err.message);
    res.status(500).json({ 
      error: 'Replication failed',
      details: err.message 
    });
  }
});

/**
 * ENDPOINT: GET /health
 * Healthcheck pour vérifier que le serveur est opérationnel
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'B',
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(config.PORT, () => {
  console.log(` Server B running on port ${config.PORT}`);
  console.log(` Replication endpoint: POST /sync`);
  console.log(` Data directory: ${config.DATA_DIR}`);
});

export default app;