import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import noteService from '../../../shared/services/noteService.js';
import { verifyToken } from '../../../shared/utils/crypto.js';
import ReplicationService from '../../../shared/services/replicationService.js';
import { 
  validateCreateNote, 
  validateUpdateNote, 
  validateNoteId 
} from '../validators/noteValidators.js';

import config from '../config.js';

const router = express.Router();

// Initialiser le service de réplication
const replicationService = new ReplicationService(
  process.env.PEER_SERVER_URL || 'http://localhost:3002',
  process.env.REPLICATION_SECRET || 'shared-secret-change-in-production'
);

// Middleware to authenticate requests
function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// CRUD routes for notes avec validation 

//liste toutes les notes
router.get('/', auth, (req, res) => {
  res.json(noteService.listNotes(config.DATA_DIR, req.user.id));
});

router.get('/:id', auth, validateNoteId,(req, res) => {
  try {
    res.json(noteService.getNote(config.DATA_DIR, req.user.id, req.params.id));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});


// Crée une nouvelle note avec validation
router.post('/', auth,validateCreateNote, (req, res) => {
  try {
    const note = noteService.createNote(
      config.DATA_DIR,
      req.user.id,
      uuidv4(),
      req.body.title,
      req.body.content
    );

    // Répliquer vers l'autre serveur (asynchrone, non-bloquant)
    replicationService.replicateCreate(note)
      .catch(err => console.error('Replication warning:', err.message));

    res.status(201).json(note);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Met à jour une note avec validation
router.put('/:id', auth,validateUpdateNote, (req, res) => {
  try {
    // Vérifier la longueur du contenu
    const MAX_CONTENT_LENGTH = 10000; // on peut ajuster la limite
    if (req.body.content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: `Validation: content too long (max ${MAX_CONTENT_LENGTH} chars)` });
    }
    // Mettre à jour localement
    const note = noteService.updateNote(
      config.DATA_DIR, 
      req.user.id, 
      req.params.id, 
      req.body.content
    );

    // Répliquer la modification (asynchrone)
    replicationService.replicateUpdate(note)
      .catch(err => console.error('Replication warning:', err.message));

    res.json(note);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Supprime une note avec validation
router.delete('/:id', auth, validateNoteId,(req, res) => {
  try {
    noteService.deleteNote(config.DATA_DIR, req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Endpoint pour vérifier la santé de la réplication
router.get('/system/replication-status', auth, async (req, res) => {
  const health = await replicationService.checkPeerHealth();
  res.json({
    peerServer: process.env.PEER_SERVER_URL || 'http://localhost:3002',
    status: health.healthy ? 'connected' : 'disconnected',
    details: health
  });
});

export default router;
