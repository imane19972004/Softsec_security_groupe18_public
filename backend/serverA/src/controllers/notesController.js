import { saveNote, loadNote, removeNote } from "../repositories/noteRepository.js";
import crypto from "crypto";

/**
 * Création d'une note
 */
export async function createNote(req, res, next) {
  try {
    const { content } = req.body;

    // En Semaine 1 : user simulé
    const userId = req.user?.id || "demo-user";
    const noteId = crypto.randomUUID();

    saveNote(userId, noteId, content);

    res.status(201).json({
      message: "Note created",
      noteId
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lecture d'une note
 */
export async function getNote(req, res, next) {
  try {
    const userId = req.user?.id || "demo-user";
    const { noteId } = req.params;

    const content = loadNote(userId, noteId);

    res.status(200).json({ content });
  } catch (err) {
    next(err);
  }
}

/**
 * Suppression d'une note
 */
export async function deleteNote(req, res, next) {
  try {
    const userId = req.user?.id || "demo-user";
    const { noteId } = req.params;

    removeNote(userId, noteId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
