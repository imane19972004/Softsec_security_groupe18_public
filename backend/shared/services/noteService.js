import fs from 'fs';
import path from 'path';
import Note from '../models/note.js';
import { InvalidInputError, AuthError } from '../utils/errors.js';
import { validateNoteTitle } from '../utils/validation.js';

function ensureUserDir(baseDir, userId) {
  const dir = path.join(baseDir, userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getNotePath(baseDir, userId, noteId) {
  return path.join(baseDir, userId, `${noteId}.json`);
}

function listNotes(baseDir, userId) {
  const dir = path.join(baseDir, userId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
}

function getNote(baseDir, userId, noteId) {
  const p = getNotePath(baseDir, userId, noteId);
  if (!fs.existsSync(p)) throw new InvalidInputError('Note not found');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function createNote(baseDir, userId, noteId, title, content) {
  if (!validateNoteTitle(title)) throw new InvalidInputError('Invalid title');
  if (typeof content !== 'string' || content.trim() === '')
    throw new InvalidInputError('Note content is required');

  const note = new Note(noteId, userId, title, content);
  const dir = ensureUserDir(baseDir, userId);

  fs.writeFileSync(path.join(dir, `${noteId}.json`), JSON.stringify(note, null, 2));
  return note;
}

function updateNote(baseDir, userId, noteId, content) {
  if (typeof content !== 'string' || content.trim() === '')
    throw new InvalidInputError('Invalid note content');

  const p = getNotePath(baseDir, userId, noteId);
  if (!fs.existsSync(p)) throw new InvalidInputError('Note not found');

  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  if (data.ownerId !== userId) throw new AuthError('Forbidden');

  const note = Object.assign(new Note(), data);
  note.updateContent(content);

  fs.writeFileSync(p, JSON.stringify(note, null, 2));
  return note;
}

function deleteNote(baseDir, userId, noteId) {
  const p = getNotePath(baseDir, userId, noteId);
  if (!fs.existsSync(p)) throw new InvalidInputError('Note not found');

  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  if (data.ownerId !== userId) throw new AuthError('Forbidden');

  fs.unlinkSync(p);
}

export default { listNotes, getNote, createNote, updateNote, deleteNote };