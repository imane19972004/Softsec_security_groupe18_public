class SearchFilter {
  constructor() {
    this.allNotes = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
  }

  setNotes(notes) {
    this.allNotes = notes || [];
    this.applyFilters();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    this.applyFilters();
  }

  setSearchTerm(term) {
    this.searchTerm = term.toLowerCase();
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.style.display = term ? 'block' : 'none';
    }
    this.applyFilters();
  }

  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    this.searchTerm = '';
    document.getElementById('clearSearch').style.display = 'none';
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allNotes];
    
    // Filter par accès
    if (this.currentFilter === 'owned') {
      filtered = filtered.filter(n => n.access === 'owner');
    } else if (this.currentFilter === 'shared') {
      filtered = filtered.filter(n => n.access !== 'owner');
    }
    
    // Filter par recherche
    if (this.searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(this.searchTerm) ||
        n.content.toLowerCase().includes(this.searchTerm)
      );
    }
    
    this.renderNotes(filtered);
  }

  renderNotes(notes) {
    const list = document.getElementById('notesList');
    const emptyDiv = document.getElementById('emptySearch');
    const countDiv = document.getElementById('notesCount');
    
    if (!list) return;
    
    list.innerHTML = '';
    
    // Empty state
    if (notes.length === 0) {
      if (emptyDiv) emptyDiv.style.display = 'block';
      if (list) list.style.display = 'none';
      if (countDiv) countDiv.innerHTML = '';
      return;
    }
    
    // Show list
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (list) list.style.display = 'grid';
    
    // Count
    const filterText = this.currentFilter === 'all' ? '' :
                      this.currentFilter === 'owned' ? ' my' : ' shared';
    if (countDiv) {
      countDiv.innerHTML = `Showing <strong>${notes.length}</strong>${filterText} note${notes.length !== 1 ? 's' : ''}`;
    }
    
    // Render
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

  // Recharger et re-render (utilisé après delete, etc.)
  async loadAndRender() {
    try {
      const res = await API.get("/notes");
      this.setNotes(res.data || []);
    } catch (err) {
      window.notificationManager?.error("Failed to load notes");
    }
  }
}

const searchFilter = new SearchFilter();

// Global functions pour onclick
function setFilter(filter) {
  searchFilter.setFilter(filter);
}

function filterNotes() {
  const input = document.getElementById('searchInput');
  if (input) searchFilter.setSearchTerm(input.value);
}

function clearSearch() {
  searchFilter.clearSearch();
}

function shareNote(noteId) {
  window.currentShareNoteId = noteId;
  window.location.href = 'share.html';
}

window.SearchFilter = SearchFilter;
window.searchFilter = searchFilter;
window.setFilter = setFilter;
window.filterNotes = filterNotes;
window.clearSearch = clearSearch;
window.shareNote = shareNote;