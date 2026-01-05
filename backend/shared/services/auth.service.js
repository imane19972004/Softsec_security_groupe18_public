import { v4 as uuidv4 } from 'uuid';
import { createUserRepository } from '../repositories/user.repository.js';
import { generateToken } from '../utils/crypto.js';

export default function createAuthService(DATA_DIR) {
  const userRepository = createUserRepository(DATA_DIR);

  return {
    register: async (email, password) => {
      const user = await userRepository.create(uuidv4(), email, password);
      return user;
    },

    login: async (email, password) => {
      const user = await userRepository.authenticate(email, password);
      return generateToken({ id: user.id, email: user.email });
    }
  };
}
