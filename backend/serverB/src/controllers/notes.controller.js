// backend/serverB/src/controllers/notes.controller.js
import ReplicationService from '../../../shared/services/replicationService.js';
import createNoteService from '../../../shared/services/note.service.js';
import { createUserRepository } from '../../../shared/repositories/user.repository.js';
import { AuthError } from '../../../shared/utils/errors.js';
import config from '../config.js';
import { logger } from '../../../shared/config/logger.js';

const noteService = createNoteService(config.DATA_DIR);
const replicationService = new ReplicationService(
  config.PEER_SERVER_URL,
  config.REPLICATION_SECRET,
  config.DATA_DIR,
  'B'
);
const userRepository = createUserRepository(config.DATA_DIR);

async function list(req, res, next) {
  try {
    const notes = await noteService.listNotes(req.user.id);
    logger.info(`[ServerB:Notes] Listed ${notes.length} notes for user ${req.user.id}`);
    res.json(notes);
  } catch (err) {
    logger.error(`[ServerB:Notes] List error: ${err.message}`);
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const note = await noteService.getNote(req.user.id, req.params.id);
    logger.info(`[ServerB:Notes] Retrieved note ${req.params.id}`);
    res.json(note);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    logger.error(`[ServerB:Notes] Get error: ${err.message}`);
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, content } = req.body;
    const note = await noteService.createNote(req.user.id, title, content);

    await replicationService.replicateNoteCreate(note);

    logger.info(`[ServerB:Notes] Created note ${note.id}`);
    res.status(201).json(note);
  } catch (err) {
    logger.error(`[ServerB:Notes] Create error: ${err.message}`);
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const note = await noteService.updateNote(req.user.id, req.params.id, req.body.content);

    await replicationService.replicateNoteUpdate(note);

    logger.info(`[ServerB:Notes] Updated note ${note.id}`);
    res.json(note);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    logger.error(`[ServerB:Notes] Update error: ${err.message}`);
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const note = await noteService.getNote(req.user.id, req.params.id);
    await noteService.deleteNote(req.user.id, req.params.id);

    await replicationService.replicateNoteDelete(note);

    logger.info(`[ServerB:Notes] Deleted note ${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    logger.error(`[ServerB:Notes] Delete error: ${err.message}`);
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

    const note = await noteService.shareNote({
      noteId,
      ownerId,
      recipientUserId: recip.id,
      permission: permission || 'read'
    });

    await replicationService.replicateNoteUpdate(note);

    logger.info(`[ServerB:Notes] Shared note ${noteId} with ${recipient}`);
    res.json({ message: 'Note shared' });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    logger.error(`[ServerB:Notes] Share error: ${err.message}`);
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
    const recipientUserId = recip ? recip.id : null;
    if (!recipientUserId) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const note = await noteService.unshareNote({
      noteId,
      ownerId,
      recipientUserId
    });

    await replicationService.replicateNoteUpdate(note);

    logger.info(`[ServerB:Notes] Unshared note ${noteId} from ${recipient}`);
    res.json({ message: 'Share removed' });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    logger.error(`[ServerB:Notes] Unshare error: ${err.message}`);
    next(err);
  }
}

async function lock(req, res, next) {
  try {
    const note = await noteService.lockNote(req.user.id, req.params.id);
    await replicationService.replicateNoteUpdate(note);
    logger.info(`[ServerB:Notes] Locked note ${req.params.id}`);
    res.json(note);
  } catch (err) {
    logger.error(`[ServerB:Notes] Lock error: ${err.message}`);
    next(err);
  }
}

async function unlock(req, res, next) {
  try {
    const note = await noteService.unlockNote(req.user.id, req.params.id);
    await replicationService.replicateNoteUpdate(note);
    logger.info(`[ServerB:Notes] Unlocked note ${req.params.id}`);
    res.json(note);
  } catch (err) {
    logger.error(`[ServerB:Notes] Unlock error: ${err.message}`);
    next(err);
  }
}

async function replicationStatus(req, res, next) {
  try {
    const health = await replicationService.checkPeerHealth();
    const stats = replicationService.getStats();

    res.json({
      server: 'B',
      peerServer: config.PEER_SERVER_URL,
      status: health.healthy ? 'connected' : 'disconnected',
      health,
      stats
    });
  } catch (err) {
    logger.error(`[ServerB:Notes] Replication status error: ${err.message}`);
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
  replicationStatus
};
