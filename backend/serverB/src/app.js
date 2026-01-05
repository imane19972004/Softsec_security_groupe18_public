/**
 * Server B - Application Entry Point
 * 
 * Serveur de réplication sécurisée pour notes
 * Synchronise les données avec Server A
 */
// Charger les variables d'environnement avant tout
import dotenv from 'dotenv';
dotenv.config();

import https from 'https';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

// Configuration et services
import config from './config.js';
import { httpsOptions, logger } from '../../shared/config/index.js';
import createNoteService from '../../shared/services/note.service.js';
import { createUserRepository } from '../../shared/repositories/user.repository.js';

// Controllers et routes
import { createReplicationController } from './controllers/replication.controller.js';
import { createReplicationRoutes } from './routes/replication.routes.js';

// Middlewares
import { replicationAuthMiddleware } from './middlewares/replicationAuth.middleware.js';
import errorHandler from '../../shared/middlewares/error.middleware.js';

// Services
import { createReplicationService } from './services/replication.service.js';
import { tokenBlacklistService } from './services/tokenBlacklist.service.js';


// Valider au chargement
config.validateEnvironment();

// Initialiser les services
const noteService = createNoteService(config.DATA_DIR);
const userRepository = createUserRepository(config.DATA_DIR);

const userService = {
  replicateCreate: (user) => userRepository.replicateUser(user)
};

const replicationService = createReplicationService(noteService, userService);

const replicationController = createReplicationController(replicationService);
const replicationAuthMiddlewareInstance = replicationAuthMiddleware(config);

// Démarrer la blacklist automatique des tokens
tokenBlacklistService.startAutoCleanup(60 * 60 * 1000); // Toutes les heures

// Créer l'application Express
const app = express();

// MIDDLEWARES DE SÉCURITÉ
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10kb' }));
app.use(hpp());
app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX
  })
);

// Logger les requêtes entrantes
app.use((req, res, next) => {
  const loggedUrl = req.originalUrl.split('?')[0];
  logger.info(`${req.method} ${loggedUrl}`);
  next();
});

// ROUTES
app.get('/', (req, res) => {
  res.send('Server B - Secure Notes API (Replica)');
});

// Routes de réplication
const replicationRoutes = createReplicationRoutes(
  replicationController,
  replicationAuthMiddlewareInstance
);
app.use('/replication', replicationRoutes);

// endpoint /sync redirigé vers /replication/sync
app.post('/sync', (req, res) => {
  res.status(301).json({
    message: 'Endpoint moved',
    newUrl: '/replication/sync'
  });
});

// ERROR HANDLING
app.use(errorHandler);

// DÉMARRAGE DU SERVEUR
let server;
if (httpsOptions) {
  server = https.createServer(httpsOptions, app);
  server.listen(config.PORT, () => {
    logger.info(`✅ Server B running on port ${config.PORT} (HTTPS)`);
    logger.info(`📡 Replication endpoint: POST /replication/sync`);
    logger.info(`❤️  Health check: GET /replication/health`);
    logger.info(`📁 Data directory: ${config.DATA_DIR}`);
  });
} else {
  // Fallback to HTTP when TLS options are not available (dev convenience)
  const http = await import('http');
  server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.warn(`⚠️  TLS certs not found — Server B running on port ${config.PORT} (HTTP)`);
    logger.info(`📡 Replication endpoint: POST /replication/sync`);
    logger.info(`❤️  Health check: GET /replication/health`);
    logger.info(`📁 Data directory: ${config.DATA_DIR}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  tokenBlacklistService.stopAutoCleanup();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;