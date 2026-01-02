// backend/serverA/src/validators/noteValidators.js
import { body, param, validationResult } from 'express-validator';

/**
 * Middleware pour gérer les erreurs de validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Grouper les erreurs par champ
    const errorMessages = errors.array().reduce((acc, error) => {
      const field = error.path || error.param;
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(error.msg);
      return acc;
    }, {});

    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

/**
 * Validation pour la création de note
 */
export const validateCreateNote = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?éèàùâêîôûç]+$/u)
    .withMessage('Title contains invalid characters')
    .escape(),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Validation pour la mise à jour de note
 */
export const validateUpdateNote = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Note ID is required')
    .isUUID()
    .withMessage('Invalid note ID format'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Validation pour les opérations sur une note spécifique (GET, DELETE)
 */
export const validateNoteId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Note ID is required')
    .isUUID()
    .withMessage('Invalid note ID format'),
  
  handleValidationErrors
];