import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { InvalidInputError } from '../utils/errors.js';

class User {
  constructor(id, email, passwordHash, createdAt = new Date(), myNotes = [], notesSharedWithMe = [] ) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
    this.myNotes = myNotes;
    this.notesSharedWithMe = notesSharedWithMe;
  }

  static async create(id, email, password) {
    if (!email || !password) {
      throw new InvalidInputError('Email and password required');
    }
    const hashed = await hashPassword(password);
    return new User(id, email, hashed);
  }

  async verifyPassword(password) {
    return verifyPassword(password, this.passwordHash);
  }

  addOwnedNote(noteId) {
    if (!this.myNotes.includes(noteId)) {
      this.myNotes.push(noteId);
    }
  }

  removeOwnedNote(noteId) {
    this.myNotes = this.myNotes.filter(id => id !== noteId);
  }

  addSharedNote(noteId) {
    if (!this.notesSharedWithMe.includes(noteId)) {
      this.notesSharedWithMe.push(noteId);
    }
  }

  removeSharedNote(noteId) {
    this.notesSharedWithMe = this.notesSharedWithMe.filter(id => id !== noteId);
  }
}

export default User;