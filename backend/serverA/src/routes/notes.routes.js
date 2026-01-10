import express from 'express';
import auth from '../../../shared/middlewares/auth.middleware.js';
import notesController from '../controllers/notes.controller.js';
import { validateCreateNote, validateUpdateNote, validateNoteId, createShareValidators, createLockValidators } from '../../../shared/validators/index.js';
import config from '../config.js';

const validateShare = createShareValidators(config.DATA_DIR);
const validateLock = createLockValidators(config.DATA_DIR);

const router = express.Router();

/**
 * Toutes les routes notes sont protégées
 */
router.use(auth);

/**
 * SYSTEM — Replication status
 */
router.get('/system/replication-status', notesController.replicationStatus);

/**
 * NOTES CRUD
 */

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: retrieve all notes for the authenticated user
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: list of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *         example:
 *           - id: note-uuid
 *             title: Sample Note
 *             content: This is a sample note content.
 *             ownerId: user-uuid
 *             createdAt: 2024-01-01T12:00:00Z
 *             updatedAt: 2024-01-02T12:00:00Z
 *             sharedWith:
 *               - user2-uuid
 *               - user3-uuid
 *             locked: false
 */
router.get('/', notesController.list);

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: retrieve a specific note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The note ID
 *     responses:
 *       200:
 *         description: note object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validateNoteId, notesController.get);

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteRequest'
 *     responses:
 *       201:
 *         description: note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', validateCreateNote, notesController.create);

/**
 * @swagger
 * /notes/{id}:
 *   put:
 *     summary: update an existing note
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteRequest'
 *     responses:
 *       200:
 *         description: note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', validateUpdateNote, notesController.update);

/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: delete a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The note ID
 *     responses:
 *       204:
 *         description: note deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', validateNoteId, notesController.remove);

/**
 * @swagger
 * /notes/{id}/share:
 *   post:
 *     summary: share a note with another user
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareNoteRequest'
 *     responses:
 *       200:
 *         description: note shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/share', validateNoteId, validateShare, notesController.share);

/**
 * @swagger
 * /notes/{id}/share:
 *   delete:
 *     summary: unshare a note from a user
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The note ID
 *     responses:
 *       200:
 *         description: note unshared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/share', validateNoteId, notesController.unshare);

/**
 * LOCKING
 */
router.post('/:id/lock', validateLock, notesController.lock);
router.post('/:id/unlock', validateLock, notesController.unlock);

export default router;
