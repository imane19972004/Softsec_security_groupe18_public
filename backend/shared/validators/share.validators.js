import { body, param } from 'express-validator';
import { createUserRepository } from '../repositories/user.repository.js';
import { handleValidationErrors } from './common.validators.js';

export const createShareValidators = (dataDir) => {
  const userRepo = createUserRepository(dataDir);

  return [
    // Validation UUID note
    param('id')
      .trim()
      .isUUID()
      .withMessage('Invalid note ID format'),

    // Validation email destinataire
    body('recipient')
      .trim()
      .notEmpty()
      .withMessage('Recipient email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
      .custom(async (email) => {
        const user = userRepo.getByEmail(email);
        if (!user) {
          throw new Error('Recipient does not exist');
        }
        return true;
      }),

    // Validation permission (REQUIRED, pas optional)
    body('permission')
      .notEmpty()
      .withMessage('Permission is required')
      .isIn(['read', 'write'])
      .withMessage('Permission must be "read" or "write"'),

    // Middleware de gestion des erreurs
    handleValidationErrors
  ];
};