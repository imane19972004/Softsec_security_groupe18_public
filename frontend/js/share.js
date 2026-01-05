document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  const shareForm = document.getElementById("shareForm");
  if (shareForm) {
    shareForm.addEventListener("submit", shareNote);
  }
  loadSharedList();
});

function checkAuth() {
  if (!getToken()) {
    window.location = "index.html";
  }
}

async function shareNote(e) {
  e.preventDefault();
  const errorDiv = document.getElementById("error");
  const successDiv = document.getElementById("success");
  errorDiv.innerText = "";
  successDiv.style.display = "none";

  const noteId = sessionStorage.getItem("shareNoteId");
  const recipient = document.getElementById("recipient").value.trim();
  const permission = document.getElementById("permission").value;

  if (!noteId) {
    errorDiv.innerText = "No note selected";
    return;
  }

  if (!recipient) {
    errorDiv.innerText = "Please enter a recipient email";
    return;
  }

  try {
    // Note: This assumes a share endpoint exists on the backend
    await API.post(`/notes/${noteId}/share`, { recipient, permission });
    
    successDiv.style.display = "block";
    document.getElementById("shareForm").reset();
    sessionStorage.removeItem("shareNoteId");
    
    // refresh shared list
    loadSharedList();
  } catch (err) {
    const message = err.response?.data?.message || "Failed to share note";
    errorDiv.innerText = message;
  }
}

async function loadSharedList() {
  const noteId = sessionStorage.getItem("shareNoteId");
  const list = document.getElementById('sharedList');
  const errorDiv = document.getElementById('error');
  if (!noteId || !list) return;
  try {
    list.innerHTML = '';
    const res = await API.get(`/notes/${noteId}`);
    const shared = res.data.sharedWith || [];
    if (shared.length === 0) {
      list.innerHTML = '<li class="no-notes">Not shared with anyone yet.</li>';
      return;
    }
    shared.forEach(s => {
      const display = s.email || s.userId || 'unknown';
      const li = document.createElement('li');
      li.className = 'note-item';
      li.innerHTML = `
        <div class="note-content">
          <strong>${sanitize(display)}</strong>
          <p>Permission: ${sanitize(s.permission)}</p>
        </div>
        <div class="note-actions">
          <button class="btn-danger" onclick="unshare('${display}')">Unshare</button>
        </div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    errorDiv.innerText = err.response?.data?.message || 'Failed to load shared list';
  }
}

async function unshare(recipientId) {
  const noteId = sessionStorage.getItem("shareNoteId");
  const errorDiv = document.getElementById('error');
  if (!noteId) return;
  if (!confirm('Remove sharing for ' + recipientId + '?')) return;
  try {
    await API.delete(`/notes/${noteId}/share`, { data: { recipient: recipientId } });
    loadSharedList();
  } catch (err) {
    errorDiv.innerText = err.response?.data?.message || 'Failed to remove share';
  }
}
