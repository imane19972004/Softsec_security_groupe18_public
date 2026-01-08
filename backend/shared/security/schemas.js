export const schemas = {
  noteCreate: {
    body: (b) => {
      if (!b) throw new Error('Missing body');
      if (typeof b.title !== 'string' || b.title.trim().length < 1) throw new Error('Invalid title');
      if (b.title.length > 120) throw new Error('Title too long');
      if (typeof b.content !== 'string') throw new Error('Invalid content');
      if (b.content.length > 20000) throw new Error('Content too long');
    }
  },
  noteUpdate: {
    body: (b) => {
      if (!b) throw new Error('Missing body');
      if (typeof b.content !== 'string') throw new Error('Invalid content');
      if (b.content.length > 20000) throw new Error('Content too long');
    }
  },
  noteIdParam: {
    params: (p) => {
      if (!p?.id || typeof p.id !== 'string') throw new Error('Invalid id');
      if (p.id.length > 80) throw new Error('Invalid id');
    }
  }
};

export const authSchemas = {
  register: {
    body: (b) => {
      if (!b?.email || typeof b.email !== 'string')
        throw new Error('Invalid email');
      if (!b.email.includes('@'))
        throw new Error('Invalid email');

      if (!b?.password || typeof b.password !== 'string')
        throw new Error('Invalid password');
      if (b.password.length < 8)
        throw new Error('Password too short');
    }
  },

  login: {
    body: (b) => {
      if (!b?.email || typeof b.email !== 'string')
        throw new Error('Invalid email');
      if (!b?.password || typeof b.password !== 'string')
        throw new Error('Invalid password');
    }
  }
};
