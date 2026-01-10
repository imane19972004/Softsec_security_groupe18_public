/**
 * Global Actions
 * Common functions accessible from all pages
 */

window.editNote = (id) => {
  window.location.href = `edit.html?id=${id}`;
};

window.deleteNote = async (id) => {
  if (!confirm("Delete this note permanently?")) return;
  
  try {
    await API.delete(`/notes/${id}`);
    window.notificationManager?.success('Note deleted successfully');
    
    // Reload the notes list
    if (window.searchFilter) {
      await window.searchFilter.loadAndRender();
    } else if (window.loadNotes) {
      await window.loadNotes();
    }
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Failed to delete note';
    window.notificationManager?.error(message);
    console.error('[Delete] Error:', err);
  }
};

window.shareNote = (id) => {
  console.log('[ShareNote] Navigating to share page with ID:', id);
  // Use URL parameter instead of global variable
  window.location.href = `share.html?id=${id}`;
};

window.lockNote = async (id) => {
  try {
    await API.post(`/notes/${id}/lock`);
    window.notificationManager?.success('Note locked');
    
    // Reload if on editor page
    if (window.editor && window.editor.loadNote) {
      await window.editor.loadNote(id);
    }
  } catch (err) {
    window.notificationManager?.error('Failed to lock note');
  }
};

window.unlockNote = async (id) => {
  try {
    await API.post(`/notes/${id}/unlock`);
    window.notificationManager?.success('Note unlocked');
    
    // Reload if on editor page
    if (window.editor && window.editor.loadNote) {
      await window.editor.loadNote(id);
    }
  } catch (err) {
    window.notificationManager?.error('Failed to unlock note');
  }
};

// Refresh notes list (used after operations)
window.refreshNotes = async () => {
  if (window.searchFilter && window.searchFilter.loadAndRender) {
    await window.searchFilter.loadAndRender();
  } else if (window.loadNotes) {
    await window.loadNotes();
  }
};

// Utility function for safe navigation
window.safeNavigate = (url, params = {}) => {
  const urlObj = new URL(url, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      urlObj.searchParams.set(key, params[key]);
    }
  });
  window.location.href = urlObj.toString();
};

console.log('[GlobalActions] Initialized');