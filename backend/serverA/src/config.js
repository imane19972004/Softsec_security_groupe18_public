import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateEnvironment() {
  const requiredVars = ['JWT_SECRET', 'STORAGE_ENCRYPTION_KEY', 'REPLICATION_SECRET'];
  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) 
      missing.push(varName);
  }

  if (missing.length > 0) {
    const error = new Error(
      `ERREUR: Variables d'environnement manquantes: ${missing.join(', ')}\n` +
      `Veuillez créer un fichier .env à la racine du serveur A avec ces variables.\n` +
      `Consultez .env.example pour un modèle.`
    );
    error.code = 'MISSING_ENV_VARS';
    throw error;
  }
}

export default {
  PORT: Number(process.env.PORT_A) || 3001,  
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'https://localhost:3000',
  
  // Limiteur de taux
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 100,
  
  // Répertoires
  DATA_DIR: path.resolve(__dirname, '../../serverA/data'),
  
  // Secrets
  JWT_SECRET: process.env.JWT_SECRET,
  STORAGE_ENCRYPTION_KEY: process.env.STORAGE_ENCRYPTION_KEY,
  REPLICATION_SECRET: process.env.REPLICATION_SECRET,

  // URL du serveur pair
  PEER_SERVER_URL: process.env.PEER_SERVER_URL || 'https://localhost:3002',
  validateEnvironment
};
