import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import noteService from '../../../shared/services/noteService.js';
import { verifyToken } from '../../../shared/utils/crypto.js';
import config from '../config.js';

const router = express.Router();

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

// CRUD routes for notes
router.get('/', auth, (req, res) => {
  res.json(noteService.listNotes(config.DATA_DIR, req.user.id));
});

router.get('/:id', auth, (req, res) => {
  try {
    res.json(noteService.getNote(config.DATA_DIR, req.user.id, req.params.id));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const note = noteService.createNote(
      config.DATA_DIR,
      req.user.id,
      uuidv4(),
      req.body.title,
      req.body.content
    );
    res.status(201).json(note);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    res.json(
      noteService.updateNote(config.DATA_DIR, req.user.id, req.params.id, req.body.content)
    );
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    noteService.deleteNote(config.DATA_DIR, req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
