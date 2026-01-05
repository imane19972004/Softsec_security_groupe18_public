import { v4 as uuidv4 } from 'uuid';
import { createNoteRepository } from '../repositories/note.repository.js';
import { AuthError } from '../utils/errors.js';

export default function createNoteService(DATA_DIR) {
  const repo = createNoteRepository(DATA_DIR);

  return {
    listNotes: (userId) => {
      // Return owned notes plus notes shared with the user (deduplicated)
      const owned = repo.list(userId) || [];
      const accessible = repo.listAccessible ? repo.listAccessible(userId) : [];
      const map = new Map();
      accessible.forEach(n => map.set(n.id, n));
      owned.forEach(n => map.set(n.id, n));
      return Array.from(map.values());
    },

    getNote: (userId, noteId) => {
      // Try owner lookup first
      try {
        return repo.get(userId, noteId);
      } catch (e) {
        // not found in user's folder -> search globally
        if (repo.findById) {
          const note = repo.findById(noteId);
          if (!note) throw e;
          // if user is owner, already handled; check sharedWith
          const shared = Array.isArray(note.sharedWith) && note.sharedWith.find(s => s.userId === userId);
          if (shared) return note;
          // otherwise forbidden
          throw new AuthError('Forbidden');
        }
        throw e;
      }
    },
    
    createNote: (userId, title, content) =>
      repo.create(userId, uuidv4(), title, content),
    
    updateNote: (userId, noteId, content) =>
      repo.update(userId, noteId, content),
    
    deleteNote: (userId, noteId) =>
      repo.remove(userId, noteId),
    
    replicateCreate: (note) => repo.replicateFull(note),
    replicateUpdate: (note) => repo.replicateFull(note),
    replicateDelete: (note) => repo.remove(note.ownerId, note.id),
    
    shareNote: (ownerId, noteId, recipientId, permission = 'read', recipientEmail) =>
      repo.share(ownerId, noteId, recipientId, permission, recipientEmail),

    unshareNote: (ownerId, noteId, recipientIdOrEmail) =>
      repo.unshare(ownerId, noteId, recipientIdOrEmail),
  };
}
