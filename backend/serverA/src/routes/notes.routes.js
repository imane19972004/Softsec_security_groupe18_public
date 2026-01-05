import express from 'express';
import auth from '../../../shared/middlewares/auth.middleware.js';
import notesController from '../controllers/notes.controller.js';

const router = express.Router();

router.use(auth);

// System
router.get('/system/replication-status', notesController.replicationStatus);

// CRUD
router.get('/', notesController.list);
router.get('/:id', notesController.get);
router.post('/', notesController.create);
router.post('/:id/share', notesController.share);
router.delete('/:id/share', notesController.unshare);
router.put('/:id', notesController.update);
router.delete('/:id', notesController.remove);

export default router;