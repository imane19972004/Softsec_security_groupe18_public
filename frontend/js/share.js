/**
 * Share Note Functionality
 * Uses URL parameters for reliable note ID transmission
 */

let currentNoteId = null;
let currentNoteData = null;

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  
  // Get note ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  currentNoteId = urlParams.get('id');
  
  console.log('[Share] URL parameters:', window.location.search);
  console.log('[Share] Extracted note ID:', currentNoteId);
  
  // Validate we have a note ID
  if (!currentNoteId) {
    showError("No note selected for sharing. Please go back and try again.");
    disableForm();
    return;
  }
  
  // Load note data to display title
  await loadNoteInfo();
  
  // Setup form
  const shareForm = document.getElementById("shareForm");
  if (shareForm) {
    shareForm.addEventListener("submit", shareNote);
  }
  
  // Load existing shares
  await loadSharedList();
});

async function checkAuth() {
  try {
    await API.get("/notes");
  } catch (err) {
    console.log('[Auth] Not authenticated, redirecting...');
    window.location.href = "index.html";
  }
}

async function loadNoteInfo() {
  const noteTitle = document.getElementById("noteTitle");
  const notePreview = document.getElementById("notePreview");
  
  if (!currentNoteId) return;
  
  try {
    const res = await API.get(`/notes/${currentNoteId}`);
    currentNoteData = res.data;
    
    // Display note info
    if (noteTitle) {
      noteTitle.textContent = currentNoteData.title;
    }
    
    if (notePreview) {
      const preview = currentNoteData.content.length > 150
        ? currentNoteData.content.substring(0, 150) + '...'
        : currentNoteData.content;
      notePreview.textContent = preview;
    }
    
    // Check if user is owner
    if (currentNoteData.access !== 'owner') {
      showError("Only the note owner can manage sharing.");
      disableForm();
    }
    
  } catch (err) {
    showError("Failed to load note information: " + (err.response?.data?.message || err.message));
    disableForm();
  }
}

async function shareNote(e) {
  e.preventDefault();
  
  const errorDiv = document.getElementById("error");
  const successDiv = document.getElementById("success");
  const submitBtn = document.querySelector("#shareForm button[type='submit']");
  
  // Clear previous messages
  errorDiv.innerText = "";
  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  // Validate note ID
  if (!currentNoteId) {
    showError("No note selected. Please go back and select a note to share.");
    return;
  }

  // Get form values
  const recipientInput = document.getElementById("recipient");
  const permissionSelect = document.getElementById("permission");
  
  const recipient = recipientInput?.value.trim();
  const permission = permissionSelect?.value || 'read';

  // Validate recipient
  if (!recipient) {
    showError("Please enter a recipient email address.");
    recipientInput?.focus();
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipient)) {
    showError("Please enter a valid email address.");
    recipientInput?.focus();
    return;
  }

  // Prevent sharing with self
  if (currentNoteData && recipient.toLowerCase() === currentNoteData.ownerId) {
    showError("You cannot share a note with yourself.");
    return;
  }

  try {
    // Disable button during submission
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sharing...";
    }

    console.log(`[Share] Sharing note ${currentNoteId} with ${recipient} (${permission})`);
    
    await API.post(`/notes/${currentNoteId}/share`, { 
      recipient, 
      permission 
    });
    
    // Show success
    if (successDiv) {
      successDiv.textContent = `✓ Note shared with ${recipient}!`;
      successDiv.style.display = "block";
    }
    
    window.notificationManager?.success(`Note shared with ${recipient}`);
    
    // Reset form
    if (recipientInput) recipientInput.value = '';
    if (permissionSelect) permissionSelect.value = 'read';
    
    // Refresh shared list
    await loadSharedList();
    
  } catch (err) {
    const message = err.response?.data?.message || err.message || "Failed to share note";
    showError(message);
    console.error('[Share] Error:', err);
  } finally {
    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Share Note";
    }
  }
}

async function loadSharedList() {
  const list = document.getElementById('sharedList');
  const errorDiv = document.getElementById('error');
  
  if (!currentNoteId || !list) return;
  
  try {
    list.innerHTML = '<li class="loading" style="text-align: center; padding: 20px; color: var(--gray-600);">Loading...</li>';
    
    const res = await API.get(`/notes/${currentNoteId}`);
    const shared = res.data.sharedWith || [];
    
    list.innerHTML = '';
    
    if (shared.length === 0) {
      list.innerHTML = `
        <li class="no-notes">
          <p>📭 Not shared with anyone yet</p>
          <p style="font-size: 14px; color: var(--gray-600); margin-top: 8px;">
            Use the form above to share this note
          </p>
        </li>
      `;
      return;
    }
    
    shared.forEach((s, idx) => {
      const display = s.email || s.userId || 'Unknown user';
      const permissionBadge = s.permission === 'write' 
        ? '<span class="permission-badge write">Can Edit</span>'
        : '<span class="permission-badge read">Read Only</span>';
      
      const li = document.createElement('li');
      li.className = 'note-item';
      li.style.animationDelay = `${idx * 0.1}s`;
      li.innerHTML = `
        <div class="note-content">
          <strong>${sanitize(display)}</strong>
          <p style="margin-top: 4px;">${permissionBadge}</p>
        </div>
        <div class="note-actions">
          <button 
            class="btn-danger" 
            onclick="unshare('${sanitize(display)}')"
            aria-label="Remove access for ${sanitize(display)}"
          >
            🗑️ Remove
          </button>
        </div>
      `;
      list.appendChild(li);
    });
    
    console.log(`[Share] Loaded ${shared.length} shared users`);
    
  } catch (err) {
    console.error('[Share] Failed to load shared list:', err);
    list.innerHTML = `
      <li class="no-notes" style="color: var(--danger);">
        ⚠️ Failed to load sharing list
      </li>
    `;
  }
}

async function unshare(recipientEmail) {
  if (!currentNoteId) return;
  
  if (!confirm(`Remove sharing access for ${recipientEmail}?`)) {
    return;
  }
  
  try {
    console.log(`[Share] Removing access for ${recipientEmail}`);
    
    await API.delete(`/notes/${currentNoteId}/share`, { 
      data: { recipient: recipientEmail } 
    });
    
    window.notificationManager?.success(`Access removed for ${recipientEmail}`);
    
    // Reload list
    await loadSharedList();
    
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to remove share';
    showError(message);
    console.error('[Share] Unshare error:', err);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  window.notificationManager?.error(message);
}

function disableForm() {
  const form = document.getElementById('shareForm');
  if (form) {
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => input.disabled = true);
  }
}

// Global function for onclick
window.unshare = unshare;