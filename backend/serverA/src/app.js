import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import https from 'https';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import config from './config.js';
import swaggerSpec from './config/swagger.config.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import errorHandler from '../../shared/middlewares/error.middleware.js';
import ReplicationService from '../../shared/services/replicationService.js';
import { httpsOptions, logger } from '../../shared/config/index.js';

// Validate environment
config.validateEnvironment();

const app = express();

// Initialize replication service
const replicationService = new ReplicationService(
  config.PEER_SERVER_URL,
  config.REPLICATION_SECRET,
  config.DATA_DIR,
  'A'
);

replicationService.startQueueProcessing(5000);

// swagger setup
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Secure Notes API - Documentation',
  })
);

app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://validator.swagger.io'],
      },
    },
  })
);

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

// Logger les requêtes entrantes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl.split('?')[0]}`);
  next();
});

/// ROUTES
app.get('/', (req, res) => {
  res.json({
    message: 'Server A - Secure Notes API',
    version: '2.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/auth',
      notes: '/notes',
    },
    replication: replicationService.getStats(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'A',
    timestamp: new Date().toISOString(),
    replication: replicationService.getStats(),
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/crash', () => {
    throw new Error('Test error');
  });
}

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// Error handling middleware
app.use(errorHandler);

// Start HTTPS server
let server;

if (httpsOptions) {
  server = https.createServer(httpsOptions, app);
  server.listen(config.PORT, () => {
    logger.info(`✅ Server A running (HTTPS) on port ${config.PORT}`);
    logger.info(`📚 API Docs: https://localhost:${config.PORT}/api-docs`);
    logger.info(`🔄 Replication peer: ${config.PEER_SERVER_URL}`);
  });
} else {
  const http = await import('http');
  server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.warn(`⚠️ HTTPS disabled — running HTTP on port ${config.PORT}`);
    logger.info(`📚 API Docs: http://localhost:${config.PORT}/api-docs`);
  });
}

/* =======================
   Graceful shutdown
======================= */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');

  replicationService.stopQueueProcessing();

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
