import { validationResult } from 'express-validator';

/**
 * Middleware centralisé de gestion des erreurs de validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = {};

    for (const err of errors.array()) {
      const field = err.path;
      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(err.msg);
    }

    return res.status(400).json({
      error: 'Validation failed',
      details
    });
  }

  next();
};