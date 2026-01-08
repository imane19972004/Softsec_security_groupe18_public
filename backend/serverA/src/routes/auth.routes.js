import express from 'express';
import rateLimit from 'express-rate-limit';

import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../../../shared/utils/crypto.js';
import userService from '../../../shared/services/userService.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: "Too many login attempts, please try again later."
});


//Annoter les routes d'authentification

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     description: |
 *       Inscription d'un nouvel utilisateur avec validation stricte.
 *       
 *       **Contraintes de sécurité**:
 *       - Email valide requis
 *       - Mot de passe: minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
 *       - Hash bcrypt avec 12 rounds
 *       - Détection des comptes existants
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *             example:
 *               email: user@example.com
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/register', authController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Se connecter et obtenir un token JWT
 *     description: |
 *       Authentification avec email et mot de passe.
 *       
 *       **Sécurité**:
 *       - Rate limiting: 100 tentatives par 15 minutes
 *       - Token JWT valide 1 heure
 *       - Protection contre brute force
 *       - Aucune énumération des comptes (messages génériques)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', loginLimiter, authController.login);


export default router;



//router.post('/register', authController.register);
//router.post('/login', authController.login);

