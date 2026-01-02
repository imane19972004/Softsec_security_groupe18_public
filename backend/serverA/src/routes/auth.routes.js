import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../../../shared/utils/crypto.js';
import userService from '../../../shared/services/userService.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';

const router = express.Router();

// User registration route avec validation
router.post('/register', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.register(uuidv4(), email, password);
    res.status(201).json({ message: 'User registered sucessfully', email: user.email });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// User login route avec validation
router.post('/login', validateRegister,async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.authenticate(email, password);
    const token = generateToken({ id: user.id, email: user.email });
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

export default router;