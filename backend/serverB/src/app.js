import dotenv from 'dotenv';
dotenv.config();

import https from 'https';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import config from './config.js';
import { httpsOptions, logger } from '../../shared/config/index.js';
import createNoteService from '../../shared/services/note.service.js';
import { createUserRepository } from '../../shared/repositories/user.repository.js';
import ReplicationService from '../../shared/services/replicationService.js';

// Controllers & routes
import { createReplicationController } from './controllers/replication.controller.js';
import { createReplicationRoutes } from './routes/replication.routes.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';

// Middlewares
import { replicationAuthMiddleware } from './middlewares/replicationAuth.middleware.js';
import errorHandler from '../../shared/middlewares/error.middleware.js';

// Services
import { createReplicationService } from './services/replication.service.js';
import { tokenBlacklistService } from '../../shared/services/tokenBlacklist.service.js';

// Validate environment variables
config.validateEnvironment();

// Initialize services
const noteService = createNoteService(config.DATA_DIR);
const userRepository = createUserRepository(config.DATA_DIR);

const userService = {
  replicateCreate: (user) => userRepository.replicateUser(user),
  replicateUpdate: (user) => userRepository.replicateUpdate(user),
};

// Bidirectional replication service instance
const replicationServiceBidirectional = new ReplicationService(
  config.PEER_SERVER_URL,
  config.REPLICATION_SECRET,
  config.DATA_DIR,
  'B'
);

replicationServiceBidirectional.startQueueProcessing(5000);

const replicationService = createReplicationService(noteService, userService);
const replicationController = createReplicationController(replicationService);
const replicationAuthMiddlewareInstance = replicationAuthMiddleware(config);

// Token blacklist cleanup
tokenBlacklistService.startAutoCleanup(60 * 60 * 1000);

// Initialize Express app
const app = express();

// Security middlewares
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      config.FRONTEND_ORIGIN,
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(hpp());

app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl.split('?')[0]}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Server B - Secure Notes API (Autonomous)',
    version: '2.0.0',
    capabilities: ['auth', 'notes', 'replication'],
    replication: replicationServiceBidirectional.getStats(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'B',
    timestamp: new Date().toISOString(),
    replication: replicationServiceBidirectional.getStats(),
  });
});

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// Replication routes (incoming from Server A)
const replicationRoutes = createReplicationRoutes(
  replicationController,
  replicationAuthMiddlewareInstance
);
app.use('/replication', replicationRoutes);

// Error handling middleware
app.use(errorHandler);

// Start HTTPS or HTTP server based on configuration
let server;

if (httpsOptions) {
  server = https.createServer(httpsOptions, app);
  server.listen(config.PORT, () => {
    logger.info(`✅ Server B running (HTTPS) on port ${config.PORT}`);
    logger.info(`🔐 Auth endpoints: /auth`);
    logger.info(`📝 Notes endpoints: /notes`);
    logger.info(`🔄 Replication endpoint: /replication`);
  });
} else {
  const http = await import('http');
  server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.warn(`⚠️ HTTPS disabled — running HTTP on port ${config.PORT}`);
    logger.info(`🔐 Auth endpoints: /auth`);
    logger.info(`📝 Notes endpoints: /notes`);
    logger.info(`🔄 Replication endpoint: /replication`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');

  tokenBlacklistService.stopAutoCleanup();
  replicationServiceBidirectional.stopQueueProcessing();

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
