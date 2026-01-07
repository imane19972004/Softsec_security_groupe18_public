// backend/serverA/src/controllers/notes.controller.js
import ReplicationService from '../../../shared/services/replicationService.js';
import createNoteService from '../../../shared/services/note.service.js';
import { createUserRepository } from '../../../shared/repositories/user.repository.js';
import { AuthError } from '../../../shared/utils/errors.js';
import config from '../config.js';

const noteService = createNoteService(config.DATA_DIR);
const replicationService = new ReplicationService(
  config.PEER_SERVER_URL, config.REPLICATION_SECRET
);
const userRepository = createUserRepository(config.DATA_DIR);

function list(req, res, next) {
  try {
    res.json(noteService.listNotes(req.user.id));
  } catch (err) {
    next(err);
  }
}

function get(req, res, next) {
  try {
    const note = noteService.getNote(req.user.id, req.params.id);
    res.json(note);
  } catch (err) {
    // Si c'est une AuthError, retourner 403 au lieu de 400
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next(err);
  }
}

function create(req, res, next) {
  try {
    const { title, content } = req.body;
    const note = noteService.createNote(req.user.id, title, content);
    replicationService.replicateNoteCreate(note);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const note = noteService.updateNote(req.user.id, req.params.id, req.body.content);
    replicationService.replicateNoteUpdate(note);
    res.json(note);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const note = noteService.getNote(req.user.id, req.params.id);
    noteService.deleteNote(req.user.id, req.params.id);
    replicationService.replicateNoteDelete(note);
    res.status(204).end();
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next(err);
  }
}

async function share(req, res, next) {
  try {
    const ownerId = req.user.id;
    const noteId = req.params.id;
    const { recipient, permission } = req.body || {};

    if (!recipient) return res.status(400).json({ message: 'Recipient required' });
    const recip = userRepository.getByEmail(recipient);
    if (!recip) return res.status(404).json({ message: 'Recipient not found' });

    const note = noteService.shareNote(ownerId, noteId, recip.id, permission || 'read', recip.email);
    replicationService.replicateNoteUpdate(note);
    res.json({ message: 'Note shared' });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next(err);
  }
}

async function unshare(req, res, next) {
  try {
    const ownerId = req.user.id;
    const noteId = req.params.id;
    const { recipient } = req.body || {};

    if (!recipient) return res.status(400).json({ message: 'Recipient required' });
    const recip = userRepository.getByEmail(recipient);
    let identifier = recipient;
    if (recip) {
      identifier = recip.email || recip.id;
    }

    const note = noteService.unshareNote(ownerId, noteId, identifier);
    replicationService.replicateNoteUpdate(note);
    res.json({ message: 'Share removed' });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next(err);
  }
}

function lock(req, res, next) {
  try {
    const note = noteService.lockNote(req.user.id, req.params.id);
    replicationService.replicateNoteUpdate(note);
    res.json(note);
  } catch (err) {
    next(err);
  }
}

function unlock(req, res, next) {
  try {
    const note = noteService.unlockNote(req.user.id, req.params.id);
    replicationService.replicateNoteUpdate(note);
    res.json(note);
  } catch (err) {
    next(err);
  }
}

async function replicationStatus(req, res, next) {
  try {
    const health = await replicationService.checkPeerHealth();
    res.json({
      peerServer: process.env.PEER_SERVER_URL,
      status: health.healthy ? 'connected' : 'disconnected',
      details: health
    });
  } catch (err) {
    next(err);
  }
}




export default { list, get, create, update, remove, share, unshare, lock, unlock, replicationStatus };

