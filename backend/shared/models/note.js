class Note {
  constructor(id, ownerId, title, content, sharedWith = [], locked = false, createdAt = new Date()) {
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.content = content;
    this.sharedWith = sharedWith; // [{ userId, permission: 'read' | 'write' }]
    this.locked = locked;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }

  shareWith(userId, permission = 'read') {
    if (!['read', 'write'].includes(permission)) throw new Error('Invalid permission');
    this.sharedWith.push({ userId, permission });
  }

  updateContent(newContent) {
    if (this.locked) throw new Error('Note is locked');
    this.content = newContent;
    this.updatedAt = new Date();
  }
}

export default Note;