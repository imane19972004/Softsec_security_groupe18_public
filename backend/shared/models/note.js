class Note {
  constructor(id, ownerId, title, content, sharedWith = [], locked = false, createdAt = new Date()) {
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.content = content;
    this.sharedWith = sharedWith; // [{ userId, permission: 'read' | 'write' }]
    this.locked = locked;
    this.lockedBy = null;
    this.lockedAt = null;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }

  shareWith(userId, permission = 'read') {
    if (!['read', 'write'].includes(permission)) throw new Error('Invalid permission');
    this.sharedWith.push({ userId, permission });
  }

  updateContent(newContent, userId) {
    if (!this.locked) {
      throw new Error('Note must be locked before editing');
    }
    if (this.lockedBy !== userId) {
      throw new Error('You do not own the lock');
    }

    this.content = newContent;
    this.updatedAt = new Date();
  }


  lock(userId) {
    if (this.locked && this.lockedBy !== userId) {
      throw new Error('Note already locked');
    }
    this.locked = true;
    this.lockedBy = userId;
    this.lockedAt = new Date();
  }

  unlock(userId) {
    if (!this.locked) return;
    if (this.lockedBy !== userId) {
      throw new Error('Only lock owner can unlock');
    }
    this.locked = false;
    this.lockedBy = null;
    this.lockedAt = null;
  }
}

export default Note;