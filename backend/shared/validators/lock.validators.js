import { param } from 'express-validator';
import { createNoteRepository } from '../repositories/note.repository.js';
import { handleValidationErrors } from './common.validators.js';

/**
 * Validators pour les opérations de lock/unlock
 * Vérifie que l'utilisateur a le droit de verrouiller/déverrouiller la note
 */
export const createLockValidators = (dataDir) => {
  const noteRepo = createNoteRepository(dataDir);

  return [
    // Validation UUID
    param('id')
      .trim()
      .isUUID()
      .withMessage('Invalid note ID format'),

    // Middleware custom pour vérifier ownership/write access
    async (req, res, next) => {
      try {
        const noteId = req.params.id;
        const userId = req.user.id;

        // Récupérer la note
        const note = noteRepo.findById(noteId);

        if (!note) {
          return res.status(404).json({ 
            error: 'Validation failed',
            details: { id: ['Note not found'] }
          });
        }

        // Vérifier les permissions
        const isOwner = note.ownerId === userId;
        const hasWriteAccess = note.sharedWith?.find(
          s => s.userId === userId && s.permission === 'write'
        );

        if (!isOwner && !hasWriteAccess) {
          return res.status(403).json({ 
            error: 'Validation failed',
            details: { 
              permission: ['You do not have permission to lock/unlock this note'] 
            }
          });
        }

        // Attacher la note au req pour éviter de la recharger dans le controller
        req.note = note;
        next();
      } catch (err) {
        next(err);
      }
    },

    handleValidationErrors
  ];
};