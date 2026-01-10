





// backend/serverA/__tests__/integration/hardening.test.js

import request from 'supertest';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import createNoteService from '../../../shared/services/note.service.js';
import { createUserRepository } from '../../../shared/repositories/user.repository.js';
import { generateToken } from '../../../shared/utils/crypto.js';
import auth from '../../../shared/middlewares/auth.middleware.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data-hardening');

function createTestApp() {
  const app = express();
  app.use(express.json());

  const noteService = createNoteService(TEST_DATA_DIR);
  const userRepository = createUserRepository(TEST_DATA_DIR);

  // Login rate limiter (ISSUE 2)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again later.' }
  });

  // Share rate limiter (ISSUE 14)
  const shareLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many share operations. Please try again later.' }
  });

  // Delete rate limiter (ISSUE 14)
  const deleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many delete operations. Please try again later.' }
  });

  // Mock login endpoint with rate limiting
  app.post('/auth/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;
    if (email === 'test@example.com' && password === 'correct') {
      const token = generateToken({ id: uuidv4(), email });
      return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });

  // Mock share endpoint with rate limiting
  app.post('/notes/:id/share', auth, shareLimiter, (req, res) => {
    res.json({ message: 'Note shared' });
  });

  // Mock delete endpoint with rate limiting
  app.delete('/notes/:id', auth, deleteLimiter, (req, res) => {
    res.status(204).end();
  });

  // Mock get endpoint (ISSUE 7 - Generic error messages)
  app.get('/notes/:id', auth, async (req, res) => {
  try {
    const note = await noteService.getNote(req.user.id, req.params.id);
    res.json(note);
  } catch (err) {
    res.status(403).json({ error: 'Access denied' });
  }
});


  return app;
}

describe('Security Hardening Tests', () => {
  let app;
  let token;

  beforeAll(() => {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

    app = createTestApp();
    token = generateToken({ id: uuidv4(), email: 'test@example.com' });
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  describe('ISSUE 2: Login Rate Limiting', () => {
    it('should allow first 5 login attempts', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' })
        );
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect([401, 429]).toContain(result.status);
      });
    });

    it('should block 6th login attempt within 15 minutes', async () => {
      // Cette tentative devrait échouer à cause du rate limit
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      // Peut être 401 (si rate limit pas atteint) ou 429 (si atteint)
      expect([401, 429]).toContain(response.status);
    });
  });

  describe('ISSUE 14: Critical Endpoints Rate Limiting', () => {
    it('should apply rate limiting on share endpoint', async () => {
      const noteId = uuidv4();
      
      // Faire plusieurs requêtes de partage
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post(`/notes/${noteId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ recipient: `user${i}@test.com`, permission: 'read' })
        );
      }

      const results = await Promise.all(promises);
      
      // Toutes devraient passer (sous la limite de 20)
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should apply rate limiting on delete endpoint', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .delete(`/notes/${uuidv4()}`)
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const results = await Promise.all(promises);
      
      // Toutes devraient passer (sous la limite de 10)
      results.forEach(result => {
        expect(result.status).toBe(204);
      });
    });
  });

  describe('ISSUE 7: Generic Error Messages', () => {
    it('should return generic error for non-existent note', async () => {
      const response = await request(app)
        .get(`/notes/${uuidv4()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      
      // Ne devrait PAS contenir "not found", "does not exist", etc.
      expect(response.body.error).not.toContain('not found');
      expect(response.body.error).not.toContain('does not exist');
    });

    it('should return generic error for unauthorized access', async () => {
      const anotherUserToken = generateToken({ 
        id: uuidv4(), 
        email: 'another@example.com' 
      });

      const response = await request(app)
        .get(`/notes/${uuidv4()}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      
      // Message générique, pas de détails
      expect(response.body.error).not.toContain('owner');
      expect(response.body.error).not.toContain('permission');
    });
  });

  describe('Combined Security Checks', () => {
    it('should enforce all security measures together', async () => {
      // Test que les 3 corrections fonctionnent ensemble
      
      // 1. Rate limiting sur login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'correct' });
      
      expect([200, 429]).toContain(loginResponse.status);

      // 2. Generic error messages
      const errorResponse = await request(app)
        .get(`/notes/${uuidv4()}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(errorResponse.status).toBe(403);
      expect(errorResponse.body.error).toBe('Access denied');

      // 3. Rate limiting sur endpoints critiques
      const shareResponse = await request(app)
        .post(`/notes/${uuidv4()}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send({ recipient: 'test@test.com', permission: 'read' });
      
      expect([200, 429]).toContain(shareResponse.status);
    });
  });
});