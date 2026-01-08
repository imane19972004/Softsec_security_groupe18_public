import { v4 as uuidv4 } from 'uuid';
import { createUserRepository } from '../repositories/user.repository.js';
import { generateToken } from '../utils/crypto.js';

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    const err = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters long');
    err.statusCode = 400;
    throw err;
  }

  if (!/[A-Z]/.test(password)) {
    const err = new Error('Password must contain at least one uppercase letter');
    err.statusCode = 400;
    throw err;
  }

  if (!/[0-9]/.test(password)) {
    const err = new Error('Password must contain at least one number');
    err.statusCode = 400;
    throw err;
  }
}

export default function createAuthService(DATA_DIR) {
  const userRepository = createUserRepository(DATA_DIR);

  return {
    register: async (email, password) => {
      validatePassword(password);
      const user = await userRepository.create(uuidv4(), email, password);
      return user;
    },

    login: async (email, password) => {
      const user = await userRepository.authenticate(email, password);
      return generateToken({ id: user.id, email: user.email });
    }
  };
}
