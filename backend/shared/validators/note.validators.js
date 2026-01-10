import { body, param } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import { handleValidationErrors } from './common.validators.js';

/**
 * Fonction de sanitation
 */
const sanitize = (value, allowedTags = [], allowedAttrs = []) => {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: allowedAttrs.reduce((acc, attr) => {
      // Appliquer cet attribut à tous les tags
      acc[attr] = allowedTags;
      return acc;
    }, {}),
  });
};

/**
 * Validation pour la création de note
 */
const validateCreateNote = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters')
    .customSanitizer(value => sanitize(value, [], [])),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters')
    .customSanitizer(value =>
      sanitize(value, [
        'b', 'i', 'em', 'strong',
        'a', 'p', 'ul', 'ol', 'li', 'br',
        'h1','h2','h3','h4','h5','h6',
        'code','pre','blockquote'
      ], ['href'])
    ),

  handleValidationErrors
];

/**
 * Validation pour la mise à jour d'une note
 */
const validateUpdateNote = [
  param('id')
    .trim()
    .isUUID()
    .withMessage('Invalid note ID format'),

  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters')
    .customSanitizer(value =>
      sanitize(value, [
        'b', 'i', 'em', 'strong',
        'a', 'p', 'ul', 'ol', 'li', 'br',
        'h1','h2','h3','h4','h5','h6',
        'code','pre','blockquote'
      ], ['href'])
    ),

  handleValidationErrors
];

/**
 * Validation pour les opérations GET / DELETE sur une note
 */
const validateNoteId = [
  param('id')
    .trim()
    .isUUID()
    .withMessage('Invalid note ID format'),

  handleValidationErrors
];

export { validateCreateNote, validateUpdateNote, validateNoteId };
