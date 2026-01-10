# 🔐 Sécurité - Groupe 18

Application de notes sécurisées avec réplication inter-serveurs et gestion de tokens.

## 📋 Structure

```
.
├── backend/
│   ├── serverA/          # Serveur principal
│   ├── serverB/          # Serveur de réplication
│   └── shared/           # Code partagé
├── frontend/             # Frontend
├── docs/                 # Documentation
├── .env.example          # Template de configuration
└── README.md
```

## 🚀 Quick Start

### 1. Configuration
```bash
# Créer le fichier .env
cp .env.example .env

# Générer les secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Remplir .env avec les valeurs générées
```

### 2. Installation
```bash
# Backend - Shared
cd backend/shared
npm install

# Backend - Server A
cd backend/serverA
npm install

# Backend - Server B
cd backend/serverB
npm install

# Shared
cd backend/shared
npm install
```

### 3. Démarrage
```bash
# Terminal 1 - Server A (port 3001)
cd backend/serverA
npm start

# Terminal 2 - Server B (port 3002)
cd backend/serverB
npm start

# Terminal 3 - Frontend (port 3000) - pas encore disponible
cd frontend
npm start
```

## 📚 Documentation

### Configuration - Variables d'environnement requises
- [.env.example](.env.example) - Template de configuration



## 🔐 Sécurité Améliorée

### Variables d'Environnement Requises
```bash
JWT_SECRET                    # Signature des JWTs
STORAGE_ENCRYPTION_KEY        # Chiffrement au repos
REPLICATION_SECRET            # Auth inter-serveurs
```

### Validations
- ✅ Erreur immédiate si variables manquantes
- ✅ Documentation complète

## 🔐 Génération des Certificats HTTPS

Les certificats TLS sont requis pour HTTPS. Générez-les avant de démarrer:

### Linux/macOS:
```bash
chmod +x scripts/generate-certs.sh
./scripts/generate-certs.sh
```

### Vérification:
```bash
ls backend/shared/certs/
# Devrait afficher: cert.pem, key.pem
```

## 🩺 Vérification de Santé

### Tester Server A:
```bash
curl -k https://localhost:3001/health
# Réponse attendue: {"status":"healthy","server":"A",...}
```

### Tester Server B:
```bash
curl -k https://localhost:3002/health
# Réponse attendue: {"status":"healthy","server":"B",...}
```

### Tester la réplication:
```bash
curl -k https://localhost:3001/notes/system/replication-status \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## 🐛 Troubleshooting

### Erreur: "MISSING_ENV_VARS"
**Cause:** Fichier `.env` manquant ou incomplet

**Solution:**
1. Copier `.env.example` vers `.env` à la racine de chaque serveur.
2. Générer les secrets (voir section Configuration)
3. Redémarrer les serveurs

### Erreur: "HTTPS certificates not found"
**Cause:** Certificats TLS manquants

**Solution:**
```bash
./scripts/generate-certs.sh
```

### Erreur: "Port already in use"
**Cause:** Un autre processus utilise le port

**Solution:**
```bash
# Linux/macOS
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erreur: "Cannot connect to peer server"
**Cause:** Server B n'est pas démarré ou réplication mal configurée

**Solution:**
1. Vérifier que Server B est démarré: `curl -k https://localhost:3002/health`
2. Vérifier `PEER_SERVER_URL` dans `.env`
3. Vérifier `REPLICATION_SECRET` identique sur les deux serveurs