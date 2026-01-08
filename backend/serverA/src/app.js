import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import https from 'https';
import http from 'http';
import swaggerUi from 'swagger-ui-express';

import config from './config.js';
import swaggerSpec from './config/swagger.config.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import errorHandler from '../../shared/middlewares/error.middleware.js';
import { httpsOptions, logger } from '../../shared/config/index.js';

config.validateEnvironment();

const app = express();

/* =======================
   Swagger
======================= */
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

/* =======================
   Security & Middlewares
======================= */
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

app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '30kb' }));
app.use(hpp());

app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX,
  })
);

/* =======================
   Logger
======================= */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl.split('?')[0]}`);
  next();
});

/* =======================
   Routes
======================= */
app.get('/', (req, res) => {
  res.json({
    message: 'Server A - Secure Notes API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

app.get('/crash', () => {
  throw new Error('Test error');
});

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

/* =======================
   Error Handler
======================= */
app.use(errorHandler);

/* =======================
   Server bootstrap
======================= */
let server;

if (httpsOptions) {
  server = https.createServer(httpsOptions, app);
  server.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`✅ HTTPS Server running on port ${config.PORT}`);
    logger.info(`📚 https://localhost:${config.PORT}/api-docs`);
  });
} else {
  server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.warn(`⚠️ HTTP Server running on port ${config.PORT}`);
  });
}

/* =======================
   Graceful shutdown
======================= */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
