import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import dotenv from 'dotenv';

import config from './config.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';

dotenv.config();

const app = express();

// Middlewares for security and parsing
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

// Routes
app.get('/', (req, res) => {
  res.send('Server A - Secure Notes API');
});
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// Start server
app.listen(config.PORT, () => {
  console.log(`Server A running on port ${config.PORT}`);
});

export default app;