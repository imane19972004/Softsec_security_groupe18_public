import { v4 as uuidv4 } from 'uuid';
import { createNoteRepository } from '../repositories/note.repository.js';
import { createUserRepository } from '../repositories/user.repository.js';
import { validateNoteContent } from '../utils/validation.js';
import { AuthError, InvalidInputError } from '../utils/errors.js';
import Note from '../models/note.js';

const VALID_PERMISSIONS = ['read', 'write'];

export default function createNoteService(DATA_DIR) {
  const noteRepo = createNoteRepository(DATA_DIR);
  const userRepo = createUserRepository(DATA_DIR);

  function getAccessForUser(note, userId) {
    if (!note || !userId) return 'read';

    if (note.ownerId === userId) {
      return 'owner';
    }

    const shared = (note.sharedWith || []).find((s) => s.userId === userId);
    if (!shared) {
      return 'read';
    }

    return shared.permission === 'write' ? 'write' : 'read';
  }

  async function getUserNotesWithAccess(userId) {
    // on utilise list + listAccessible pour rester aligné avec le repo
    const owned = noteRepo.list(userId) || [];
    const accessible = noteRepo.listAccessible ? noteRepo.listAccessible(userId) : [];
    const map = new Map();

    [...owned, ...accessible].forEach((n) => {
      map.set(n.id, {
        ...n,
        access: getAccessForUser(n, userId),
        currentUserId: userId
      });
    });

    return Array.from(map.values());
  }

  async function listNotes(userId) {
    // renvoie déjà enrichi avec access/currentUserId
    return getUserNotesWithAccess(userId);
  }

  async function getNote(userId, noteId) {
    // d'abord: dossier du user (owner)
    try {
      const note = noteRepo.get(userId, noteId);
      return {
        ...note,
        currentUserId: userId,
        access: getAccessForUser(note, userId)
      };
    } catch (e) {
      // pas dans le dossier -> chercher globalement
      if (noteRepo.findById) {
        const note = noteRepo.findById(noteId);
        if (!note) throw e;

        const access = getAccessForUser(note, userId);
        if (access === 'read' && note.ownerId !== userId) {
          // note non partagée avec cet user
          throw new AuthError('Forbidden');
        }

        note.currentUserId = userId;
        note.access = access;
        return note;
      }
      throw e;
    }
  }

  async function createNote(userId, title, content) {
    if (!validateNoteContent(content)) {
      throw new InvalidInputError('Invalid note content');
    }

    const noteId = uuidv4();
    const note = noteRepo.create(userId, noteId, title, content);

    // mettre à jour le user (myNotes)
    const owner = await userRepo.getUserById(userId);
    if (owner && owner.addOwnedNote) {
      owner.addOwnedNote(noteId);
      await userRepo.update(owner);
    }

    return note;
  }

  async function updateNote(userId, noteId, content) {
    if (!validateNoteContent(content)) {
      throw new InvalidInputError('Invalid note content');
    }
    return noteRepo.update(userId, noteId, content);
  }

  async function deleteNote(userId, noteId) {
    const note = noteRepo.findById(noteId);
    if (!note) throw new InvalidInputError('Not found');
    if (note.ownerId !== userId) throw new AuthError('Forbidden');

    await noteRepo.remove(userId, noteId);

    // mettre à jour myNotes / notesSharedWithMe
    const owner = await userRepo.getUserById(userId);
    if (owner && owner.removeOwnedNote) {
      owner.removeOwnedNote(noteId);
      await userRepo.update(owner);
    }

    return;
  }

  async function shareNote({ noteId, ownerId, recipientUserId, permission }) {
    if (!VALID_PERMISSIONS.includes(permission)) {
      throw new InvalidInputError('Invalid permission');
    }

    const note = noteRepo.findById(noteId);
    if (!note) {
      throw new InvalidInputError('Resource not found');
    }
    if (note.ownerId !== ownerId) {
      throw new AuthError('Not allowed to share this note');
    }

    note.sharedWith = note.sharedWith || [];
    const existing = note.sharedWith.find((s) => s.userId === recipientUserId);
    if (existing) {
      existing.permission = permission;
    } else {
      note.sharedWith.push({ userId: recipientUserId, permission });
    }

    noteRepo.replicateFull(note);

    const recipient = await userRepo.getUserById(recipientUserId);
    if (recipient && recipient.addSharedNote) {
      recipient.addSharedNote(noteId);
      await userRepo.update(recipient);
    }

    return note;
  }

  async function unshareNote({ noteId, ownerId, recipientUserId }) {
    const note = noteRepo.findById(noteId);
    if (!note) throw new InvalidInputError('Note not found');
    if (note.ownerId !== ownerId) throw new AuthError('Not allowed to unshare this note');

    note.sharedWith = (note.sharedWith || []).filter((s) => s.userId !== recipientUserId);
    noteRepo.replicateFull(note);

    const recipient = await userRepo.getUserById(recipientUserId);
    if (recipient && recipient.removeSharedNote) {
      recipient.removeSharedNote(noteId);
      await userRepo.update(recipient);
    }

    return note;
  }

  async function lockNote(userId, noteId) {
    const note = noteRepo.findById(noteId);
    if (!note) throw new InvalidInputError('Note not found');

    const isOwner = note.ownerId === userId;
    const shared = note.sharedWith?.find((s) => s.userId === userId);

    if (!isOwner && (!shared || shared.permission !== 'write')) {
      throw new AuthError('Forbidden');
    }

    const n = Object.assign(new Note(), note);
    n.lock(userId);
    noteRepo.replicateFull(n);
    return n;
  }

  async function unlockNote(userId, noteId) {
    const note = noteRepo.findById(noteId);
    if (!note) throw new InvalidInputError('Note not found');

    const n = Object.assign(new Note(), note);
    n.unlock(userId);
    noteRepo.replicateFull(n);
    return n;
  }

  // hooks de réplication utilisés par ReplicationService
  async function replicateCreate(note) {
    return noteRepo.replicateFull(note);
  }

  async function replicateUpdate(note) {
    return noteRepo.replicateFull(note);
  }

  async function replicateDelete(note) {
    return noteRepo.remove(note.ownerId, note.id);
  }

  return {
    listNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    shareNote,
    unshareNote,
    lockNote,
    unlockNote,
    replicateCreate,
    replicateUpdate,
    replicateDelete,
    getAccessForUser,
    getUserNotesWithAccess
  };
}
