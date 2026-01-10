const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const app = express();

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '..')));

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Charger les certificats SSL/TLS
const certPath = path.join(__dirname, '../../backend/shared/certs/cert.pem');
const keyPath = path.join(__dirname, '../../backend/shared/certs/key.pem');

let server;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // HTTPS
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  server = https.createServer(httpsOptions, app);
  server.listen(PORT, () => {
    console.log(`✅ Frontend server running on https://localhost:${PORT} (HTTPS)`);
    console.log(`📝 API calls go to https://localhost:3001`);
    console.log(`🔐 Same origin (HTTPS) → Cookies will work!`);
    console.log('');
    console.log('⚠️  IMPORTANT: Accept self-signed certificate:');
    console.log('   - Visit https://localhost:3000 in browser');
    console.log('   - Click "Advanced" → "Continue to localhost"');
  });
} else {
  // Fallback HTTP
  console.warn('⚠️  Certificates not found, falling back to HTTP');
  console.warn(`   Looking for: ${certPath}`);
  console.warn(`   Cookies may not work properly!`);
  
  app.listen(PORT, () => {
    console.log(`⚠️  Frontend server running on http://localhost:${PORT} (HTTP)`);
  });
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});