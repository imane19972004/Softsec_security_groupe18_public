// backend/shared/repositories/user.repository.js
import fs from 'fs';
import path from 'path';
import User from '../models/user.js';
import { InvalidInputError, AuthError } from '../utils/errors.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

export function createUserRepository(DATA_DIR) {
  const USERS_DIR = path.join(DATA_DIR, 'users');
  const USERS_FILE = path.join(USERS_DIR, 'users.json');

  function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return {};
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  }

  function writeUsers(data) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  async function create(id, email, password) {
    email = email.toLowerCase().trim();

    if (!validateEmail(email)) throw new InvalidInputError('Invalid email');
    if (!validatePassword(password)) throw new InvalidInputError('Weak password');

    const users = readUsers();
    if (users[email]) throw new InvalidInputError('User already exists');

    const user = await User.create(id, email, password);

    users[email] = {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt.toISOString(),
      myNotes: user.myNotes || [],
      notesSharedWithMe: user.notesSharedWithMe || []
    };

    writeUsers(users);
    return user;
  }

  async function update(user) {
    const users = readUsers();

    const createdAtString =
      typeof user.createdAt === 'string'
        ? user.createdAt
        : user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : new Date().toISOString();

    users[user.email] = {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: createdAtString,
      myNotes: user.myNotes || [],
      notesSharedWithMe: user.notesSharedWithMe || []
    };

    replicateUser(user);
    writeUsers(users);
  }

  async function authenticate(email, password) {
    email = email.toLowerCase().trim();
    const users = readUsers();
    const u = users[email];
    if (!u) throw new AuthError('Invalid credentials');

    const user = new User(
      u.id,
      u.email,
      u.passwordHash,
      new Date(u.createdAt),
      u.myNotes || [],
      u.notesSharedWithMe || []
    );

    const ok = await user.verifyPassword(password);
    if (!ok) throw new AuthError('Invalid credentials');

    return user;
  }

  function getByEmail(email) {
    email = (email || '').toLowerCase().trim();
    const users = readUsers();
    const u = users[email];
    if (!u) return null;

    return {
      id: u.id,
      email: u.email,
      createdAt: new Date(u.createdAt),
      myNotes: u.myNotes || [],
      notesSharedWithMe: u.notesSharedWithMe || []
    };
  }

  function getUserById(id) {
    const users = readUsers();
    for (const email in users) {
      const u = users[email];
      if (u.id === id) {
        // reconstruire un vrai User pour profiter des méthodes add*/remove*
        return new User(
          u.id,
          u.email,
          u.passwordHash || '',
          new Date(u.createdAt),
          u.myNotes || [],
          u.notesSharedWithMe || []
        );
      }
    }
    return null;
  }

  function replicateUser(user) {
    const users = readUsers();

    let createdAtString;
    if (typeof user.createdAt === 'string') {
      createdAtString = user.createdAt;
    } else if (user.createdAt instanceof Date) {
      createdAtString = user.createdAt.toISOString();
    } else {
      createdAtString = new Date().toISOString();
    }

    users[user.email] = {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: createdAtString,
      myNotes: user.myNotes || [],
      notesSharedWithMe: user.notesSharedWithMe || []
    };

    writeUsers(users);
  }

  function replicateUpdate(userData) {
    const users = readUsers();
    
    const existingUser = users[userData.email];
    if (!existingUser) {
      throw new Error(`User ${userData.email} not found for update replication`);
    }

    // Mettre à jour uniquement les champs modifiables
    users[userData.email] = {
      ...existingUser, // Conserver passwordHash et autres données
      myNotes: userData.myNotes || existingUser.myNotes || [],
      notesSharedWithMe: userData.notesSharedWithMe || existingUser.notesSharedWithMe || []
    };

    writeUsers(users);
    logger.info(`[UserRepository] Replicated user update: ${userData.email}`);
  }

  return { create, authenticate, getByEmail, replicateUser, replicateUpdate, update, getUserById };
}
