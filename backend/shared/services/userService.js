import fs from 'fs';
import path from 'path';
import User from '../models/user.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { InvalidInputError, AuthError } from '../utils/errors.js';

const USERS_DIR = path.join(process.cwd(), 'users');
const USERS_FILE = path.join(USERS_DIR, 'users.json');

if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

async function register(id, email, password) {
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
    createdAt: user.createdAt
  };

  writeUsers(users);
  return user;
}

async function authenticate(email, password) {
  email = email.toLowerCase().trim();
  const users = readUsers();
  const u = users[email];
  if (!u) throw new AuthError('User not found');

  const user = new User(u.id, u.email, u.passwordHash, new Date(u.createdAt));
  const ok = await user.verifyPassword(password);
  if (!ok) throw new AuthError('Invalid credentials');

  return user;
}

export default { register, authenticate };