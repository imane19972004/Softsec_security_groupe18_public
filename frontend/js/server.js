const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = 3000;
const SERVER_A = 'https://localhost:3001';
const SERVER_B = 'https://localhost:3002';

const app = express();

// Serve static frontend files from parent folder
app.use(express.static(path.join(__dirname, '..')));

// Proxy API routes to backend servers
app.use(['/auth', '/notes'], createProxyMiddleware({
  target: SERVER_A,
  changeOrigin: true,
  secure: false,
  logLevel: 'info'
}));

app.use(['/replication'], createProxyMiddleware({
  target: SERVER_B,
  changeOrigin: true,
  secure: false,
  logLevel: 'info'
}));

// Fallback for unknown routes: serve index.html (multi-page fallback isn't strictly necessary)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend + proxy server running on http://localhost:${PORT}`);
  console.log(`Proxy: /auth,/notes -> ${SERVER_A}`);
  console.log(`Proxy: /replication -> ${SERVER_B}`);
});
