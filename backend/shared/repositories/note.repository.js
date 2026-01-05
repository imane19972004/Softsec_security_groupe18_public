import fs from 'fs';
import path from 'path';
import { validate as isUUID } from 'uuid';
import Note from '../models/note.js';
import { encryptForStorage, decryptFromStorage } from '../utils/crypto-storage.js';
import { InvalidInputError, AuthError } from '../utils/errors.js';
import { validateNoteTitle } from '../utils/validation.js';

function assertUUID(value, name) {
  if (!isUUID(value)) throw new InvalidInputError(`Invalid ${name}`);
}

export function createNoteRepository(DATA_DIR) {
  const NOTES_DIR = path.join(DATA_DIR, 'notes');

  function userDir(userId) {
    const dir = path.join(NOTES_DIR, userId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function notePath(userId, noteId) {
    const dir = userDir(userId);
    const filePath = path.resolve(path.join(dir, `${noteId}.enc`));

    if (!filePath.startsWith(path.resolve(dir))) {
      throw new InvalidInputError('Invalid path');
    }

    return filePath;
  }

  function list(userId) {
    assertUUID(userId, 'userId');
    const dir = userDir(userId);

    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.enc'))
      .map(f => {
        try {
          const encrypted = fs.readFileSync(path.join(dir, f), 'utf-8');
          return JSON.parse(decryptFromStorage(encrypted));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  function findById(noteId) {
    assertUUID(noteId, 'noteId');
    if (!fs.existsSync(NOTES_DIR)) return null;

    const users = fs.readdirSync(NOTES_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    for (const u of users) {
      const p = path.join(NOTES_DIR, u, `${noteId}.enc`);
      if (fs.existsSync(p)) {
        try {
          const encrypted = fs.readFileSync(p, 'utf-8');
          return JSON.parse(decryptFromStorage(encrypted));
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  function listAccessible(userId) {
    assertUUID(userId, 'userId');
    if (!fs.existsSync(NOTES_DIR)) return [];

    const results = [];
    const users = fs.readdirSync(NOTES_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    for (const u of users) {
      const dir = path.join(NOTES_DIR, u);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.enc'));
      for (const f of files) {
        try {
          const encrypted = fs.readFileSync(path.join(dir, f), 'utf-8');
          const note = JSON.parse(decryptFromStorage(encrypted));
          if (note.ownerId === userId) {
            results.push(note);
          } else if (Array.isArray(note.sharedWith) && note.sharedWith.find(s => s.userId === userId)) {
            results.push(note);
          }
        } catch {
          // skip corrupted
        }
      }
    }

    return results;
  }

  function get(userId, noteId) {
    assertUUID(userId, 'userId');
    assertUUID(noteId, 'noteId');

    const p = notePath(userId, noteId);
    if (!fs.existsSync(p)) throw new InvalidInputError('Note not found');

    return JSON.parse(decryptFromStorage(fs.readFileSync(p, 'utf-8')));
  }

  function create(userId, noteId, title, content) {
    assertUUID(userId, 'userId');
    assertUUID(noteId, 'noteId');

    if (!validateNoteTitle(title)) throw new InvalidInputError('Invalid title');
    if (!content) throw new InvalidInputError('Invalid content');

    const note = new Note(noteId, userId, title, content);
    fs.writeFileSync(notePath(userId, noteId), encryptForStorage(JSON.stringify(note)));
    return note;
  }

  function update(userId, noteId, content) {
    const data = get(userId, noteId);
    if (data.ownerId !== userId) throw new AuthError('Forbidden');

    const note = Object.assign(new Note(), data);
    note.updateContent(content);

    fs.writeFileSync(notePath(userId, noteId), encryptForStorage(JSON.stringify(note)));
    return note;
  }

  function remove(userId, noteId) {
    const data = get(userId, noteId);
    if (data.ownerId !== userId) throw new AuthError('Forbidden');

    fs.unlinkSync(notePath(userId, noteId));
  }

  function share(userId, noteId, recipientId, permission = 'read', recipientEmail) {
    const data = get(userId, noteId);
    if (data.ownerId !== userId) throw new AuthError('Forbidden');

    const note = Object.assign(new Note(), data);
    // normalize permission
    if (!['read', 'write'].includes(permission)) throw new InvalidInputError('Invalid permission');

    const existing = note.sharedWith.find(s => s.userId === recipientId || s.email === recipientEmail);
    if (existing) {
      existing.permission = permission;
      existing.userId = recipientId;
      if (recipientEmail) existing.email = recipientEmail;
    } else {
      // store both id and email when available
      note.sharedWith.push({ userId: recipientId, email: recipientEmail || null, permission });
    }

    fs.writeFileSync(notePath(userId, noteId), encryptForStorage(JSON.stringify(note)));
    return note;
  }

  function unshare(userId, noteId, recipientIdOrEmail) {
    const data = get(userId, noteId);
    if (data.ownerId !== userId) throw new AuthError('Forbidden');

    const note = Object.assign(new Note(), data);
    note.sharedWith = note.sharedWith.filter(s => !(s.userId === recipientIdOrEmail || s.email === recipientIdOrEmail));

    fs.writeFileSync(notePath(userId, noteId), encryptForStorage(JSON.stringify(note)));
    return note;
  }

  function replicateFull(note) {
    const dir = userDir(note.ownerId);
    fs.writeFileSync(
      path.join(dir, `${note.id}.enc`),
      encryptForStorage(JSON.stringify(note))
    );
  }


  return { list, get, create, update, remove, share, unshare, findById, listAccessible, replicateFull };
}
