# Frontend local server

This folder contains a small Node/Express static server that serves the frontend files and proxies API calls to the backend servers.

Quick start

1. Install dependencies from the `frontend` folder:

```bash
cd frontend
npm install
```

2. Run the server (default port 3000):

```bash
npm start
```

3. Optional development mode with auto-reload (requires `nodemon`):

```bash
npm run dev
```

Environment variables

- `PORT` — port where the frontend server listens (default: `3000`).
- `SERVER_A` — backend Server A target (default: `http://localhost:3001`).
- `SERVER_B` — backend Server B target (default: `http://localhost:3002`).

Notes

- The frontend code now uses relative API paths (see `js/api.service.js`) so requests go to this server and are proxied to the proper backend.
- If your backend runs with HTTPS and self-signed certs, you can still proxy by setting `SERVER_A`/`SERVER_B` to the correct `https://...` URL. The proxy is configured with `secure: false` to allow self-signed certs in development.
# Frontend - Secure Notes Application

## Overview
The frontend is a modern, responsive web application for managing secure notes. It provides a complete user interface for authentication, note management, and sharing.

## Features Fixed & Improved

### ✅ Authentication
- **Login & Register** pages with proper validation
- Secure token storage in sessionStorage
- Auto-logout on session expiration
- Better error messages from server

### ✅ Notes Management
- **List Notes**: Display all user notes with preview
- **Create Notes**: Add new notes with title and content
- **Edit Notes**: Update existing notes
- **Delete Notes**: Remove notes with confirmation
- Proper error handling and loading states

### ✅ UI/UX Improvements
- Modern gradient design with purple theme
- Responsive layout (mobile, tablet, desktop)
- Form validation before submission
- Clear error and success messages
- Loading indicators
- Better visual hierarchy and spacing

### ✅ Security Enhancements
- DOMPurify library added to all pages for XSS prevention
- Improved sanitization function (HTML encoding)
- Authentication checks before accessing protected pages
- Token-based API requests with Bearer header

## File Structure

```
frontend/
├── index.html           # Login page
├── register.html        # Registration page
├── notes.html          # Notes list page
├── edit.html           # Create/Edit note page
├── share.html          # Share note page
├── css/
│   └── style.css       # Modern, responsive styling
└── js/
    ├── api.service.js  # Axios API client with interceptors
    ├── auth.js         # Authentication logic
    ├── notes.js        # Notes management logic
    ├── share.js        # Note sharing logic
    └── utils.js        # Utility functions (token, sanitize)
```

## Key Changes Made

### HTML Files
1. **Added DOMPurify** library to all pages
2. **Improved structure** with semantic sections (container, header, etc.)
3. **Better form labels** and placeholders
4. **Added loading spinners** and status messages
5. **Responsive design** with CSS classes

### JavaScript Files
1. **auth.js**: Added validation, better error messages, password requirements
2. **notes.js**: Added loading states, delete confirmation, better error handling, auth checks
3. **utils.js**: Improved sanitize function using HTML encoding (no DOMPurify dependency)
4. **api.service.js**: Already good, just needed proper imports in HTML

### CSS
- Complete redesign with modern gradients and shadows
- Flexbox layout for responsive design
- Smooth transitions and hover effects
- Mobile-first responsive approach
- Color scheme: Purple (#667eea) as primary, red (#e74c3c) for danger

## Usage

### Starting the Application
1. Open `index.html` in a browser
2. Register a new account or login with existing credentials
3. Create, edit, or delete notes
4. Share notes with other users (if implemented on backend)

### API Endpoints Used
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /notes` - List all notes
- `GET /notes/:id` - Get specific note
- `POST /notes` - Create new note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `POST /notes/:id/share` - Share note (optional)

## Security Notes
- Tokens stored in sessionStorage (cleared on logout)
- All user input sanitized to prevent XSS
- HTTPS only (enforced by CORS policy)
- Bearer token authentication
- CSRF protection via axios interceptors

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies
- **axios**: HTTP client for API requests
- **DOMPurify**: XSS prevention library (referenced in HTML)

## Future Improvements
- Add offline support with localStorage
- Implement note categories/tags
- Add rich text editor
- Export notes functionality
- Dark mode theme
- Keyboard shortcuts
- Real-time sync with WebSockets
