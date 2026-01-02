import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import dotenv from 'dotenv';
import https from "https";
import { errorHandler } from "./middlewares/errorHandler.js";
import config from './config.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import { httpsOptions } from "./config/https.js";
import { logger } from "./config/logger.js";

dotenv.config();

const app = express();

// Middlewares for security and parsing
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

// Routes
app.get('/', (req, res) => {
  res.send('Server A - Secure Notes API');
});

app.get("/crash", (req, res) => {
  throw new Error("Test error");
});


app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

app.use(errorHandler);
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

https.createServer(httpsOptions, app).listen(config.PORT,"0.0.0.0", () => {
  logger.info(`Secure Server A running on port ${config.PORT}`);

});

export default app;