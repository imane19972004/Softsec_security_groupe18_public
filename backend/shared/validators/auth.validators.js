import { body } from 'express-validator';
import { handleValidationErrors } from './common.validators.js';

const validateRegister = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((password) => {
      // Bloquer les mots de passe communs
      const commonPasswords = ['password', '12345678', 'qwerty', 'admin'];
      if (commonPasswords.includes(password.toLowerCase())) {
        throw new Error('Password too common');
      }
      return true;
    }),

  handleValidationErrors
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters'),

    handleValidationErrors
];

export { validateRegister, validateLogin };