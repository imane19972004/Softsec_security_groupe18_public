import express from 'express';
import auth from '../../../shared/middlewares/auth.middleware.js';
import notesController from '../controllers/notes.controller.js';
import { validateCreateNote, validateUpdateNote, validateNoteId, createShareValidators, createLockValidators } from '../../../shared/validators/index.js';
import config from '../config.js';

const validateLock = createLockValidators(config.DATA_DIR);
const validateShare = createShareValidators(config.DATA_DIR)

const router = express.Router();

router.use(auth);

//Annoter les routes de notes

// System
/**
 * @swagger
 * /notes/system/replication-status:
 *   get:
 *     summary: Vérifier l'état de la réplication
 *     description: Retourne l'état de santé du serveur pair et de la réplication
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: État de la réplication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 peerServer:
 *                   type: string
 *                   example: 'https://localhost:3002'
 *                 status:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                 details:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/system/replication-status', notesController.replicationStatus);

// CRUD
/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Lister toutes les notes de l'utilisateur
 *     description: |
 *       Retourne toutes les notes dont l'utilisateur est propriétaire 
 *       ou qui ont été partagées avec lui.
 *       
 *       **Sécurité**:
 *       - Authentification JWT requise
 *       - Isolation stricte par utilisateur
 *       - Données déchiffrées à la volée
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', notesController.list);

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: Récupérer une note spécifique
 *     description: |
 *       Récupère les détails d'une note par son ID.
 *       
 *       **Autorisation**:
 *       - Propriétaire de la note
 *       - Utilisateur avec qui la note est partagée (read/write)
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unique de la note
 *     responses:
 *       200:
 *         description: Détails de la note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       400:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validateNoteId, notesController.get);
/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Créer une nouvelle note
 *     description: |
 *       Crée une note chiffrée appartenant à l'utilisateur authentifié.
 *       
 *       **Sécurité**:
 *       - Validation stricte du titre (max 100 caractères)
 *       - Sanitization XSS du contenu
 *       - Chiffrement AES-256-GCM au repos
 *       - Réplication automatique vers Server B
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteRequest'
 *     responses:
 *       201:
 *         description: Note créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validateCreateNote, notesController.create);
/**
 * @swagger
 * /notes/{id}/share:
 *   post:
 *     summary: Partager une note avec un utilisateur
 *     description: |
 *       Partage une note avec un autre utilisateur en spécifiant le niveau de permission.
 *       
 *       **Permissions**:
 *       - `read`: L'utilisateur peut lire la note
 *       - `write`: L'utilisateur peut lire et modifier la note
 *       
 *       **Sécurité**:
 *       - Validation de l'existence du destinataire
 *       - Logs d'audit du partage
 *       - Notification de réplication
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareNoteRequest'
 *     responses:
 *       200:
 *         description: Note partagée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Note shared'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Destinataire non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Recipient not found'
 */
router.post('/:id/share', validateShare, notesController.share);
router.post('/:id/lock', validateLock, notesController.lock);
router.post('/:id/unlock', validateLock, notesController.unlock);
/**
 * @swagger
 * /notes/{id}/share:
 *   delete:
 *     summary: Révoquer le partage d'une note
 *     description: |
 *       Retire l'accès d'un utilisateur à une note partagée.
 *       
 *       **Autorisation**:
 *       - Seul le propriétaire peut révoquer un partage
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnshareNoteRequest'
 *     responses:
 *       200:
 *         description: Partage révoqué
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Share removed'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/:id/share', validateNoteId, notesController.unshare);
/**
 * @swagger
 * /notes/{id}:
 *   put:
 *     summary: Modifier une note existante
 *     description: |
 *       Met à jour le contenu d'une note.
 *       
 *       **Autorisation**:
 *       - Seul le propriétaire peut modifier
 *       - Les utilisateurs avec permission 'write' peuvent aussi modifier
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteRequest'
 *     responses:
 *       200:
 *         description: Note mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/:id', validateUpdateNote, notesController.update);
/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: Supprimer une note
 *     description: |
 *       Supprime définitivement une note.
 *       
 *       **Autorisation**:
 *       - Seul le propriétaire peut supprimer
 *       - Réplication automatique de la suppression
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Note supprimée avec succès
 *       400:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/:id', validateNoteId, notesController.remove);

export default router;