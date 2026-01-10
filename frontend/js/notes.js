// ----- GLOBAL STATE -----
let isSubmitting = false;

// ----- EDITOR CLASS (Centralized State Management) -----
class Editor {
  constructor() {
    this.hasUnsavedChanges = false;
    this.autosaveTimeout = null;
    this.currentMode = 'edit';
    this.currentNoteId = null;
    this.currentUserId = null;
    this.currentNote = null;
  }

  async init(noteId = null) {
    console.log('[Editor] Initializing with noteId:', noteId);
    this.currentNoteId = noteId;
    
    this.setupCharacterCounters();
    this.setupUnsavedWarning();
    this.setupToolbar();
    this.setupPreview();
    this.setupBeforeUnload();
    this.setupFormSubmit();
    this.setupDeleteButton();
    
    // Load note if editing
    if (noteId) {
      await this.loadNote(noteId);
    }
  }

  async loadNote(noteId) {
    console.log('[Editor] Loading note:', noteId);
    if (!noteId) return;
    
    try {
      const res = await API.get(`/notes/${noteId}`);
      this.currentNote = res.data;
      this.currentNoteId = res.data.id;
      this.currentUserId = res.data.currentUserId;

      // Update page title
      const pageTitle = document.getElementById('pageTitle');
      if (pageTitle) pageTitle.textContent = '✏️ Edit Note';

      // Fill form
      const titleInput = document.getElementById('title');
      const contentTextarea = document.getElementById('content');
      
      if (titleInput) {
        titleInput.value = this.currentNote.title;
        titleInput.dispatchEvent(new Event('input'));
      }
      
      if (contentTextarea) {
        contentTextarea.value = this.currentNote.content;
        contentTextarea.dispatchEvent(new Event('input'));
      }

      // Show delete button if owner
      const deleteBtn = document.getElementById('deleteBtn');
      if (deleteBtn && this.currentNote.access === 'owner') {
        deleteBtn.style.display = 'inline-block';
      }

      // Update lock UI
      this.updateLockUI(this.currentNote);
      
      // Disable editing if necessary
      if (this.shouldDisableEditing(this.currentNote)) {
        this.disableEditing();
      }
      
      console.log('[Editor] Note loaded successfully');
    } catch (err) {
      console.error('[Editor] Failed to load note:', err);
      window.notificationManager?.error('Failed to load note');
      // Redirect to notes list after error
      setTimeout(() => window.location.href = 'notes.html', 2000);
    }
  }

  shouldDisableEditing(note) {
    if (note.access === 'read') return true;
    if (note.access === 'write' && note.locked && note.lockedBy !== note.currentUserId) return true;
    return false;
  }

  disableEditing() {
    const titleInput = document.getElementById('title');
    const contentTextarea = document.getElementById('content');
    const submitBtn = document.querySelector("#noteForm button[type='submit']");
    
    if (titleInput) titleInput.disabled = true;
    if (contentTextarea) contentTextarea.disabled = true;
    if (submitBtn) submitBtn.style.display = 'none';
    
    window.notificationManager?.warning('This note is read-only');
  }

  updateLockUI(note) {
    const lockStatus = document.getElementById('lockStatus');
    const lockBtn = document.getElementById('lockBtn');
    const unlockBtn = document.getElementById('unlockBtn');
    
    if (!lockStatus) return;
    
    // Hide both buttons by default
    if (lockBtn) lockBtn.style.display = 'none';
    if (unlockBtn) unlockBtn.style.display = 'none';
    
    if (!note.locked) {
      lockStatus.innerHTML = '🔓 <strong>Unlocked</strong> - Anyone with access can edit';
      lockStatus.style.color = 'var(--success)';
      
      // Show lock button if can edit
      if (note.access !== 'read' && lockBtn) {
        lockBtn.style.display = 'inline-block';
      }
    } else if (note.lockedBy === note.currentUserId) {
      lockStatus.innerHTML = '🔒 <strong>Locked by you</strong> - Only you can edit';
      lockStatus.style.color = 'var(--warning)';
      
      if (unlockBtn) {
        unlockBtn.style.display = 'inline-block';
      }
    } else {
      lockStatus.innerHTML = '🔒 <strong>Locked by another user</strong> - Read-only for you';
      lockStatus.style.color = 'var(--danger)';
    }
  }

  setupCharacterCounters() {
    const titleInput = document.getElementById('title');
    const contentTextarea = document.getElementById('content');
    
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const count = titleInput.value.length;
        const counter = document.getElementById('titleCounter');
        if (counter) {
          counter.textContent = `${count} / 100`;
          counter.classList.remove('warning', 'danger');
          if (count > 90) counter.classList.add('danger');
          else if (count > 70) counter.classList.add('warning');
        }
        this.markUnsaved();
      });
    }

    if (contentTextarea) {
      contentTextarea.addEventListener('input', () => {
        const count = contentTextarea.value.length;
        const counter = document.getElementById('contentCounter');
        if (counter) counter.textContent = `${count} characters`;
        this.markUnsaved();
        this.scheduleAutosave();
      });
    }
  }

  markUnsaved() {
    this.hasUnsavedChanges = true;
    const warning = document.getElementById('unsavedWarning');
    if (warning) warning.classList.add('show');
  }

  markSaved() {
    this.hasUnsavedChanges = false;
    const warning = document.getElementById('unsavedWarning');
    if (warning) warning.classList.remove('show');
    
    const autosaveDot = document.getElementById('autosaveDot');
    const autosaveText = document.getElementById('autosaveText');
    
    if (autosaveDot) {
      autosaveDot.classList.remove('saving');
      autosaveDot.classList.add('saved');
    }
    if (autosaveText) {
      autosaveText.textContent = 'All changes saved';
    }
  }

  scheduleAutosave() {
    clearTimeout(this.autosaveTimeout);
    
    const autosaveDot = document.getElementById('autosaveDot');
    const autosaveText = document.getElementById('autosaveText');
    
    if (autosaveDot) {
      autosaveDot.classList.add('saving');
      autosaveDot.classList.remove('saved');
    }
    if (autosaveText) {
      autosaveText.textContent = 'Saving...';
    }
    
    this.autosaveTimeout = setTimeout(() => this.markSaved(), 2000);
  }

  setupToolbar() {
    // Toolbar buttons for text formatting
    window.insertText = (before, after) => {
      const textarea = document.getElementById('content');
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selected = text.substring(start, end) || 'text';
      
      textarea.value = text.substring(0, start) + before + selected + after + text.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      this.markUnsaved();
    };
  }

  setupPreview() {
    window.togglePreview = (mode) => {
      this.currentMode = mode;
      
      const buttons = document.querySelectorAll('.preview-btn');
      buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });
      
      const content = document.getElementById('content');
      const preview = document.getElementById('previewPane');
      const toolbar = document.querySelector('.editor-toolbar');
      
      if (mode === 'preview') {
        if (content && preview) {
          preview.innerHTML = DOMPurify.sanitize(content.value).replace(/\n/g, '<br>');
          content.style.display = 'none';
          preview.classList.add('active');
        }
        if (toolbar) toolbar.style.display = 'none';
      } else {
        if (content) content.style.display = 'block';
        if (preview) preview.classList.remove('active');
        if (toolbar) toolbar.style.display = 'flex';
      }
    };
  }

  setupUnsavedWarning() {
    const form = document.getElementById('noteForm');
    if (form) {
      form.addEventListener('submit', () => {
        this.hasUnsavedChanges = false;
      });
    }
  }

  setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  setupFormSubmit() {
    const form = document.getElementById('noteForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;

      const title = document.getElementById('title')?.value.trim();
      const content = document.getElementById('content')?.value.trim();

      if (!title || !content) {
        window.notificationManager?.error('Please fill in all fields');
        isSubmitting = false;
        return;
      }

      try {
        if (this.currentNoteId) {
          // Update existing note
          await API.put(`/notes/${this.currentNoteId}`, { content });
          window.notificationManager?.success('Note saved');
        } else {
          // Create new note
          const res = await API.post('/notes', { title, content });
          this.currentNoteId = res.data.id;
          window.history.replaceState({}, '', `edit.html?id=${this.currentNoteId}`);
          window.notificationManager?.success('Note created');
        }

        this.markSaved();
        isSubmitting = false;

        // Redirect to notes list
        setTimeout(() => {
          window.location.href = 'notes.html';
        }, 1500);
      } catch (err) {
        window.notificationManager?.error(err.response?.data?.message || 'Failed to save note');
        isSubmitting = false;
      }
    });
  }

  setupDeleteButton() {
    window.deleteCurrentNote = async () => {
      if (!this.currentNoteId) return;
      if (!confirm('Delete this note permanently?')) return;

      try {
        await API.delete(`/notes/${this.currentNoteId}`);
        window.notificationManager?.success('Note deleted');
        setTimeout(() => window.location.href = 'notes.html', 1000);
      } catch (err) {
        window.notificationManager?.error('Failed to delete note');
      }
    };
  }

  async lockNote() {
    if (!this.currentNoteId) return;
    
    try {
      const res = await API.post(`/notes/${this.currentNoteId}/lock`);
      this.currentNote = res.data;
      this.updateLockUI(res.data);
      window.notificationManager?.success('Note locked');
    } catch (err) {
      window.notificationManager?.error('Failed to lock note');
    }
  }

  async unlockNote() {
    if (!this.currentNoteId) return;
    
    try {
      const res = await API.post(`/notes/${this.currentNoteId}/unlock`);
      this.currentNote = res.data;
      this.updateLockUI(res.data);
      window.notificationManager?.success('Note unlocked');
    } catch (err) {
      window.notificationManager?.error('Failed to unlock note');
    }
  }

  confirmLeave() {
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Leave anyway?')) {
        window.location.href = 'notes.html';
      }
    } else {
      window.location.href = 'notes.html';
    }
  }
}

// ----- INITIALIZE EDITOR -----
const editor = new Editor();
window.editor = editor;

// ----- DOMContentLoaded -----
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();

  // Notes list page
  if (document.getElementById('notesList')) {
    loadNotes();
  }

  // Edit page
  if (document.getElementById('noteForm')) {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    
    console.log('[App] Initializing editor with noteId:', noteId);
    await editor.init(noteId);
    
    // Setup lock buttons
    setupLockButtons();
  }
});

// ----- AUTH CHECK -----
async function checkAuth() {
  try {
    await API.get('/notes');
  } catch (err) {
    console.log('[Auth] Not authenticated, redirecting...');
    window.location.href = 'index.html';
  }
}

// ----- LOCK BUTTONS SETUP -----
function setupLockButtons() {
  const lockBtn = document.getElementById('lockBtn');
  const unlockBtn = document.getElementById('unlockBtn');
  
  if (lockBtn) {
    lockBtn.addEventListener('click', () => editor.lockNote());
  }
  
  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => editor.unlockNote());
  }
}

// ----- NOTES LIST -----
async function loadNotes() {
  const spinner = document.getElementById('loadingSpinner');
  try {
    if (spinner) spinner.style.display = 'block';

    const res = await API.get('/notes');
    const notes = res.data || [];

    if (window.searchFilter) {
      window.searchFilter.setNotes(notes);
    } else {
      renderNotes(notes);
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to load notes';
    window.notificationManager?.error(message);
    if (err.response?.status === 401) {
      setTimeout(() => window.location.href = 'index.html', 2000);
    }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  const emptyDiv = document.getElementById('emptySearch');
  const countDiv = document.getElementById('notesCount');
  
  if (!list) return;
  
  list.innerHTML = '';
  
  if (notes.length === 0) {
    if (emptyDiv) emptyDiv.style.display = 'block';
    if (list) list.style.display = 'none';
    if (countDiv) countDiv.innerHTML = '';
    return;
  }
  
  if (emptyDiv) emptyDiv.style.display = 'none';
  if (list) list.style.display = 'grid';
  
  if (countDiv) {
    countDiv.innerHTML = `Showing <strong>${notes.length}</strong> note${notes.length !== 1 ? 's' : ''}`;
  }
  
  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.style.animationDelay = `${idx * 0.05}s`;
    
    const canEdit = note.access !== 'read';
    const canDelete = note.access === 'owner';
    
    const badge = note.access === 'owner' ? 
      '<span class="permission-badge owner">Owner</span>' :
      note.access === 'write' ?
      '<span class="permission-badge write">Can Edit</span>' :
      '<span class="permission-badge read">Read Only</span>';
    
    const preview = note.content.length > 100 
      ? note.content.substring(0, 100) + '...'
      : note.content;
    
    li.innerHTML = `
      <div class="note-content">
        <strong>
          ${sanitize(note.title)}
          ${badge}
        </strong>
        <p>${sanitize(preview)}</p>
      </div>
      <div class="note-actions">
        ${canEdit ? `<button class="btn-primary" onclick="editNote('${note.id}')">✏️ Edit</button>` : ''}
        <button class="btn-secondary" onclick="shareNote('${note.id}')">🔗 Share</button>
        ${canDelete ? `<button class="btn-danger" onclick="deleteNote('${note.id}')">🗑️ Delete</button>` : ''}
      </div>
    `;
    list.appendChild(li);
  });
}

// ----- GLOBAL FUNCTIONS -----
window.editNote = (id) => {
  window.location.href = `edit.html?id=${id}`;
};

window.deleteNote = async (id) => {
  if (!confirm('Delete this note permanently?')) return;
  try {
    await API.delete(`/notes/${id}`);
    window.notificationManager?.success('Note deleted');
    await loadNotes();
  } catch (err) {
    window.notificationManager?.error('Failed to delete: ' + err.message);
  }
};

window.shareNote = (id) => {
  window.location.href = `share.html?id=${id}`;
};