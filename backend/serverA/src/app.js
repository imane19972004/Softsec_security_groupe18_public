import dotenv from 'dotenv';
dotenv.config(); // Charger les variables d'environnement

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import https from "https";
import swaggerUi from 'swagger-ui-express';


import config from './config.js';
import swaggerSpec from './config/swagger.config.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import errorHandler from '../../shared/middlewares/error.middleware.js';
import { httpsOptions, logger } from "../../shared/config/index.js";

// Valider au chargement
config.validateEnvironment();

const app = express();

//Intégrer Swagger dans ce fichier app.js

// Swagger UI - AVANT helmet pour permettre le chargement des assets
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Secure Notes API - Documentation",
  customfavIcon: "/favicon.ico"
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://validator.swagger.io"],
    },
  },
}));
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10kb' }));
app.use(hpp());

app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX
  })
);

app.get('/', (req, res) => {
  res.json({
    message: 'Server A - Secure Notes API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/auth',
      notes: '/notes'
    }
  });
});

app.get("/crash", (req, res) => {
  throw new Error("Test error");
});


// Log all incoming requests before routes so every request is recorded
app.use((req, res, next) => {
  const loggedUrl = req.originalUrl.split('?')[0];
  logger.info(`${req.method} ${loggedUrl}`);
  next();
});

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

app.use(errorHandler);

let server;
if (httpsOptions) {
  server = https.createServer(httpsOptions, app);
  server.listen(config.PORT, () => {
    logger.info(`✅ Secure Server A running (HTTPS) on port ${config.PORT}`);
     logger.info(`📚 API Documentation: https://localhost:${config.PORT}/api-docs`);
    logger.info(`📄 OpenAPI Spec: https://localhost:${config.PORT}/api-docs.json`);
  });
} else {
  // Fallback to HTTP for local development if TLS certs are missing
  const http = await import('http');
  server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.info(`⚠️  HTTPS certificates missing — Server A running over HTTP on port ${config.PORT}`);
        logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api-docs`);
  
  });
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;