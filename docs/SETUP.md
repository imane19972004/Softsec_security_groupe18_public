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

## 📡 Endpoints Clés

### Server A (Authentification)
```bash
POST   /auth/register       # Créer un compte
POST   /auth/login          # Se connecter
GET    /notes               # Lister les notes
POST   /notes               # Créer une note
```

### Server B (Réplication)
```bash
POST   /replication/sync    # Synchroniser les données
GET    /replication/health  # Healthcheck
```

## 🧪 Tests

### Healthcheck
```bash
# Server A
curl https://localhost:3001 -k

# Server B
curl https://localhost:3002/replication/health -k
```

## 👥 Groupe 18

### Replication verification checklist

1. Create a note on Server A (replace tokens/user ids as needed):

```bash
curl -k -X POST https://localhost:3001/notes \
	-H "Authorization: Bearer <ACCESS_TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{"title":"smoke","content":"replication test"}'
```

2. Verify peer health on Server B:

```bash
curl -k https://localhost:3002/replication/health
```

3. Confirm the peer received the note:
- If Server B exposes a notes API: `GET https://localhost:3002/notes` (or the per-user endpoint)
- Otherwise inspect the data directory on Server B (e.g. `backend/serverB/data/notes/<userId>/`) to find the replicated note file.

4. Update the note on Server A and verify the update appears on Server B (repeat step 1 with `PUT /notes/:id`).

5. Delete the note on Server A and verify it is removed on Server B.

Run these steps as a smoke test after starting both servers to ensure replication is operating.