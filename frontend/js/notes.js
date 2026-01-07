document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("notesList")) loadNotes();
  if (document.getElementById("noteForm")) setupNoteForm();
  checkAuth();
});

function checkAuth() {
  if (!getToken()) {
    window.location = "index.html";
  }
}

async function loadNotes() {
  const errorDiv = document.getElementById("error");
  const spinner = document.getElementById("loadingSpinner");
  const list = document.getElementById("notesList");
  
  try {
    spinner.style.display = "block";
    errorDiv.innerText = "";
    
    const res = await API.get("/notes");
    list.innerHTML = "";

    if (!res.data || res.data.length === 0) {
      list.innerHTML = "<li class='no-notes'>No notes yet. <a href='edit.html'>Create one</a></li>";
      return;
    }

    res.data.forEach(note => {
      const li = document.createElement("li");
      li.className = "note-item";
      const canEdit = note._access !== 'read';
      const canDelete = note._access === 'owner';
      li.innerHTML = `
        <div class="note-content">
          <strong>${sanitize(note.title)}</strong>
          <p>${sanitize(note.content.substring(0, 50))}${note.content.length > 50 ? '...' : ''}</p>
        </div>
        <div class="note-actions">
          ${canEdit ? `<button class="btn-primary" onclick="editNote('${note.id}')">Edit</button>` : ''}
          <button class="btn-secondary" onclick="sessionStorage.setItem('shareNoteId','${note.id}'); window.location='share.html'">Share</button>
          ${canDelete ? `<button class="btn-danger" onclick="deleteNote('${note.id}')">Delete</button>` : ''}
        </div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    const message = err.response?.data?.message || "Failed to load notes";
    errorDiv.innerText = message;
    if (err.response?.status === 401) {
      setTimeout(() => window.location = "index.html", 2000);
    }
  } finally {
    spinner.style.display = "none";
  }
}

async function deleteNote(id) {
  if (confirm("Are you sure you want to delete this note?")) {
    try {
      await API.delete(`/notes/${id}`);
      loadNotes();
    } catch (err) {
      document.getElementById("error").innerText = "Failed to delete note";
    }
  }
}

function editNote(id) {
  sessionStorage.setItem("editNoteId", id);
  window.location = "edit.html";
}

function disableEditing() {
  document.getElementById("title").setAttribute("disabled", "disabled");
  document.getElementById("content").setAttribute("disabled", "disabled");
  document.getElementById("noteForm").querySelector("button[type='submit']").style.display = "none";
}

function shouldDisableEditing(note) {
  if (note._access === 'read') return true;
  if (note._access === 'write') {
    if (!note.locked) return true;
    if (note.lockedBy !== note.currentUserId) return true;
  }
  return false;
}

function updateLockUI(note) {
  const lockStatus = document.getElementById("lockStatus");
  const lockBtn = document.getElementById("lockBtn");
  const unlockBtn = document.getElementById("unlockBtn");

  if (!note.locked) {
    lockStatus.innerText = "Note is unlocked";
    lockBtn.style.display = "inline-block";
    unlockBtn.style.display = "none";
  } else {
    lockStatus.innerText = `Locked by ${note.lockedBy}`;
    lockBtn.style.display = "none";
    unlockBtn.style.display = "inline-block";
  }
}

async function setupNoteForm() {
  const id = sessionStorage.getItem("editNoteId");
  if (!id) {
    document.getElementById("lockBtn")?.remove();
    document.getElementById("unlockBtn")?.remove();
    document.getElementById("lockStatus")?.remove();
  }
  const errorDiv = document.getElementById("error");
  const successDiv = document.getElementById("success");
  const deleteBtn = document.getElementById("deleteBtn");
  const pageTitle = document.getElementById("pageTitle");

  if (id) {
    try {
      deleteBtn.style.display = "inline-block";
      pageTitle.innerText = "Edit Note";
      const res = await API.get(`/notes/${id}`);
      updateLockUI(res.data);

      document.getElementById("lockBtn")?.addEventListener("click", async () => {
        await API.post(`/notes/${id}/lock`);
        location.reload();
      });

      document.getElementById("unlockBtn")?.addEventListener("click", async () => {
        await API.post(`/notes/${id}/unlock`);
        location.reload();
      });

      if (shouldDisableEditing(res.data)) {
        disableEditing();
      }

      document.getElementById("title").value = res.data.title;
      document.getElementById("content").value = res.data.content;
    } catch (err) {
      errorDiv.innerText = "Failed to load note";
    }
  }

  document.getElementById("noteForm").addEventListener("submit", async e => {
    e.preventDefault();
    errorDiv.innerText = "";
    successDiv.style.display = "none";

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!title || !content) {
      errorDiv.innerText = "Please fill in all fields";
      return;
    }

    try {
      if (id) {
        await API.put(`/notes/${id}`, { title, content });
      } else {
        await API.post("/notes", { title, content });
      }

      successDiv.style.display = "block";
      sessionStorage.removeItem("editNoteId");
      setTimeout(() => {
        window.location = "notes.html";
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save note";
      errorDiv.innerText = message;
    }
  });
}

async function deleteCurrentNote() {
  const id = sessionStorage.getItem("editNoteId");
  if (id && confirm("Are you sure you want to delete this note?")) {
    try {
      await API.delete(`/notes/${id}`);
      sessionStorage.removeItem("editNoteId");
      window.location = "notes.html";
    } catch (err) {
      document.getElementById("error").innerText = "Failed to delete note";
    }
  }
}
