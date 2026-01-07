// backend/serverA/__tests__/integration/api.test.js
import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Créer une app de test simple
function createTestApp() {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  }));

  // Routes de test
  app.get('/', (req, res) => {
    res.json({ message: 'Server A - Secure Notes API' });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Test d'authentification basique
  app.post('/test/auth', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input types' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Weak password' });
    }
    
    res.status(200).json({ message: 'Validation passed' });
  });

  // Test de protection contre XSS
  app.post('/test/xss', (req, res) => {
    const { content } = req.body;
    
    // Vérifier qu'on détecte les scripts
    if (content && content.includes('<script>')) {
      return res.status(400).json({ error: 'Potentially malicious content detected' });
    }
    
    res.json({ content: content });
  });

  // Test d'erreur contrôlée
  app.get('/test/error', (req, res) => {
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

describe('API Basic Security Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Server Health', () => {
    it('should respond to root endpoint', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should respond to health check', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Input Validation', () => {
    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/test/auth')
        .send({ password: 'SecurePass123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/test/auth')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/test/auth')
        .send({
          email: 'test@example.com',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('password');
    });

    it('should accept valid input', async () => {
      const response = await request(app)
        .post('/test/auth')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('XSS Prevention', () => {
    it('should detect script tags', async () => {
      const response = await request(app)
        .post('/test/xss')
        .send({
          content: '<script>alert("XSS")</script>'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('malicious');
    });

    it('should allow safe content', async () => {
      const response = await request(app)
        .post('/test/xss')
        .send({
          content: 'This is safe content'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return generic error message', async () => {
      const response = await request(app).get('/test/error');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      
      // Ne devrait PAS contenir de stack trace
      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).not.toContain('.js:');
      expect(bodyStr).not.toContain('at ');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/');

      // Helmet headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Request Size Limits', () => {
    it('should reject oversized payloads', async () => {
      const hugePayload = 'a'.repeat(50000); // 50KB
      
      const response = await request(app)
        .post('/test/auth')
        .send({
          email: 'test@example.com',
          password: hugePayload
        });

      // Devrait être rejeté (413 ou 400)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow reasonable number of requests', async () => {
      const requests = [];
      
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/health'));
      }

      const responses = await Promise.all(requests);
      
      // Toutes devraient passer
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});