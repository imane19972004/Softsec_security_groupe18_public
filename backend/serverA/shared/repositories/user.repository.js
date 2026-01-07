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
    users[email] = user;
    writeUsers(users);
    return user;
  }

  async function authenticate(email, password) {
    email = email.toLowerCase().trim();
    const users = readUsers();
    const u = users[email];
    if (!u) throw new AuthError('Invalid credentials');

    const user = new User(u.id, u.email, u.passwordHash, new Date(u.createdAt));
    const ok = await user.verifyPassword(password);
    if (!ok) throw new AuthError('Invalid credentials');

    return user;
  }

  function getByEmail(email) {
    email = (email || '').toLowerCase().trim();
    const users = readUsers();
    const u = users[email];
    if (!u) return null;
    // Return a lightweight user object (id, email, createdAt)
    return { id: u.id, email: u.email, createdAt: new Date(u.createdAt) };
  }

  function replicateUser(user) {
    const users = readUsers();

    users[user.email] = {
      id: user.id,
      email: user.email,
      passwordHash: '__REPLICATED__',
      createdAt: user.createdAt
    };

    writeUsers(users);
  }

  return { create, authenticate, getByEmail, replicateUser };
}
