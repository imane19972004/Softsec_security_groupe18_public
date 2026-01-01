import {
  writeUserFile,
  readUserFile,
  deleteUserFile
} from "../utils/fileManager.js";

/**
 * Sauvegarde une note utilisateur
 */
export function saveNote(userId, noteId, content) {
  const filename = `${noteId}.txt`;
  writeUserFile(userId, filename, content);
}

/**
 * Charge une note utilisateur
 */
export function loadNote(userId, noteId) {
  const filename = `${noteId}.txt`;
  return readUserFile(userId, filename);
}

/**
 * Supprime une note utilisateur
 */
export function removeNote(userId, noteId) {
  const filename = `${noteId}.txt`;
  deleteUserFile(userId, filename);
}
