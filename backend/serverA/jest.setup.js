// backend/serverA/jest.setup.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis le .env racine
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Définir des valeurs de test si les variables ne sont pas définies
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
}

if (!process.env.STORAGE_ENCRYPTION_KEY) {
  process.env.STORAGE_ENCRYPTION_KEY = 'test-storage-encryption-key-for-testing-only';
}

if (!process.env.REPLICATION_SECRET) {
  process.env.REPLICATION_SECRET = 'test-replication-secret-for-testing-only';
}

// Valeurs par défaut pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT_A = process.env.PORT_A || '3001';
process.env.PORT_B = process.env.PORT_B || '3002';
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
process.env.PEER_SERVER_URL = process.env.PEER_SERVER_URL || 'https://localhost:3002';

console.log('[Jest Setup] Environment variables loaded for testing');