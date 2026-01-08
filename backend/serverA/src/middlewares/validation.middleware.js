import { body, param, validationResult } from 'express-validator';

export const validateShare = [
  param('id').isUUID().withMessage('Invalid note ID'),
  body('recipient').isEmail().withMessage('Invalid email'),
  body('permission').optional().isIn(['read', 'write']).withMessage('Invalid permission'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];