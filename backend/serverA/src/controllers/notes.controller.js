



// backend/serverA/src/controllers/notes.controller.js

import ReplicationService from '../../../shared/services/replicationService.js';
import createNoteService from '../../../shared/services/note.service.js';
import { createUserRepository } from '../../../shared/repositories/user.repository.js';
import { createAuditService } from '../../../shared/services/audit.service.js';
import { AuthError, InvalidInputError } from '../../../shared/utils/errors.js';
import config from '../config.js';

const noteService = createNoteService(config.DATA_DIR);
const replicationService = new ReplicationService(
  config.PEER_SERVER_URL, config.REPLICATION_SECRET
);
const userRepository = createUserRepository(config.DATA_DIR);
const auditService = createAuditService(config.DATA_DIR);

function list(req, res, next) {
  try {
    const notes = noteService.listNotes(req.user.id);
    auditService.logNoteAccess(req.user.id, 'list', 'list', true, { count: notes.length });
    res.json(notes);
  } catch (err) {
    auditService.logNoteAccess(req.user.id, 'list', 'list', false);
    next(err);
  }
}

function get(req, res, next) {
  try {
    const note = noteService.getNote(req.user.id, req.params.id);
    auditService.logNoteAccess(req.user.id, req.params.id, 'read', true);
    res.json(note);
  } catch (err) {
    auditService.logNoteAccess(req.user.id, req.params.id, 'read', false);
    
    // Toujours retourner "Access denied" (pas de détails)
    return res.status(403).json({ error: 'Access denied' });
  }
}

function create(req, res, next) {
  try {
    const { title, content } = req.body;
    const note = noteService.createNote(req.user.id, title, content);
    
    auditService.logNoteModification(req.user.id, note.id, 'create', { 
      title, 
      contentLength: content.length 
    });
    
    replicationService.replicateNoteCreate(note);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const note = noteService.updateNote(req.user.id, req.params.id, req.body.content);
    
    auditService.logNoteModification(req.user.id, req.params.id, 'update', {
      newContentLength: req.body.content.length
    });
    
    replicationService.replicateNoteUpdate(note);
    res.json(note);
  } catch (err) {
    //  Message générique
    return res.status(403).json({ error: 'Access denied' });
  }
}

function remove(req, res, next) {
  try {
    const note = noteService.getNote(req.user.id, req.params.id);
    noteService.deleteNote(req.user.id, req.params.id);
    
    auditService.logNoteModification(req.user.id, req.params.id, 'delete');
    replicationService.replicateNoteDelete(note);
    res.status(204).end();
  } catch (err) {
    // Message générique
    return res.status(403).json({ error: 'Access denied' });
  }
}

async function share(req, res, next) {
  try {
    const { recipient, permission } = req.body || {};
    
    if (!recipient) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const recip = userRepository.getByEmail(recipient);
    if (!recip) {
      // Pas "user not found"
      return res.status(400).json({ error: 'Invalid request' });
    }

    const note = noteService.shareNote(
      req.user.id, 
      req.params.id, 
      recip.id, 
      permission || 'read', 
      recip.email
    );
    
    auditService.logShareAction(
      req.user.id, 
      req.params.id, 
      recip.email, 
      permission || 'read', 
      'granted'
    );
    
    replicationService.replicateNoteUpdate(note);
    res.json({ message: 'Note shared' });
  } catch (err) {
    //  Message générique
    return res.status(403).json({ error: 'Access denied' });
  }
}

async function unshare(req, res, next) {
  try {
    const { recipient } = req.body || {};
    
    if (!recipient) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const note = noteService.unshareNote(req.user.id, req.params.id, recipient);
    
    auditService.logShareAction(req.user.id, req.params.id, recipient, 'revoked', 'revoked');
    replicationService.replicateNoteUpdate(note);
    res.json({ message: 'Share removed' });
  } catch (err) {
    return res.status(403).json({ error: 'Access denied' });
  }
}

function lock(req, res, next) {
  try {
    const note = noteService.lockNote(req.user.id, req.params.id);
    auditService.logLockAction(req.user.id, req.params.id, 'lock');
    replicationService.replicateNoteUpdate(note);
    res.json(note);
  } catch (err) {
    return res.status(403).json({ error: 'Access denied' });
  }
}

function unlock(req, res, next) {
  try {
    const note = noteService.unlockNote(req.user.id, req.params.id);
    auditService.logLockAction(req.user.id, req.params.id, 'unlock');
    replicationService.replicateNoteUpdate(note);
    res.json(note);
  } catch (err) {
    return res.status(403).json({ error: 'Access denied' });
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

function getAuditStats(req, res, next) {
  try {
    const stats = auditService.getAuditStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export default { 
  list, 
  get, 
  create, 
  update, 
  remove, 
  share, 
  unshare, 
  lock, 
  unlock, 
  replicationStatus,
  getAuditStats 
};





