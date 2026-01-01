import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  PORT: Number(process.env.PORT) || 3001,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100,
  DATA_DIR: path.join(__dirname, '../../data') // stockage des notes
};
