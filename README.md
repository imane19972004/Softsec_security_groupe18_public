# 🔐 Secure Notes Application - Groupe 18
> Projet académique de développement logiciel sécurisé (Master Software Security)

## 📖 À Propos

Application web sécurisée pour la gestion de notes personnelles avec:
- **Architecture distribuée** (Server A + Server B avec réplication)
- **Chiffrement end-to-end** (AES-256-GCM)
- **Authentification JWT** avec cookies HttpOnly
- **Partage sécurisé** de notes (permissions read/write)
- **Failover automatique** entre serveurs

## ✨ Fonctionnalités

### Sécurité
- ✅ Chiffrement au repos (AES-256-GCM)
- ✅ Transmission sécurisée (HTTPS/TLS)
- ✅ Authentification robuste (JWT + bcrypt)
- ✅ Protection CSRF, XSS, Injection
- ✅ Rate limiting anti-bruteforce
- ✅ Audit logging complet

### Fonctionnalités Utilisateur
- ✅ Création/édition/suppression de notes
- ✅ Partage avec permissions granulaires
- ✅ Verrouillage collaboratif (locks)
- ✅ Réplication transparente
- ✅ Interface responsive (mobile/desktop)

## 📚 Documentation

- **[Setup & Installation](docs/SETUP.md)** - Guide de démarrage rapide
- **[Documentation Sécurité](docs/README_SECURITY.md)** - Analyse de menaces, exigences, tests
- **[Architecture](docs/architecture/architecture_overview.md)** - Vue d'ensemble technique
- **[Tests de Sécurité](docs/security/security_testing_report.md)** - Résultats de validation

## 🎓 Contexte Académique

**Cours:** Software Security (Master)  
**Institution:** Université Côte d'Azur  
**Groupe:** 18  
**Contacts:** 
- rajaa.tchani@etu.unice.fr
- guilaye.diop@etu.unice.fr
- imane.amraoui@etu.unice.fr
- mouad.ait-mouloud@etu.unice.fr

## 🏗️ Architecture

```
┌───────────────────────────────────────────┐
│         FRONTEND (Port 3000)              │
│ • Interface utilisateur HTTPS             │
│ • Failover automatique entre serveurs     │
│ • Gestion sécurisée des cookies HttpOnly  │
└──────────────┬────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌─────▼──────┐
│ Server A   │◄──┤  Server B  │
│ Port 3001  │───┤  Port 3002 │
└────────────┘   └────────────┘
   (Principal)     (Réplica)
       │                │
   ┌───▼────────────────▼───┐
   │  Stockage Chiffré      │
   │  (AES-256-GCM)         │
   └────────────────────────┘
```

## 📂 **Structure des fichiers**

### **Backend**
```
backend/
├── serverA/               (Port 3001)
│   ├── src/
│   │   ├── app.js        # Express server HTTPS
│   │   ├── config.js     # Environment validation
│   │   ├── config/swagger.config.js
│   │   ├── controllers/  # auth, notes
│   │   ├── routes/       # auth, notes
│   │   └── validators/   # (deprecated, moved to shared)
│   ├── __tests__/        # 48 tests automatisés
|   ├── .env              # .env file to place here 
│   └── data/             # Stockage chiffré
│
├── serverB/               (Port 3002)
│   ├── src/
│   │   ├── app.js        # Réplica autonome
│   │   ├── controllers/  # auth, notes, replication
│   │   ├── routes/
│   │   ├── services/     
│   │   └── middlewares/  # replicationAuth
|   ├── .env              # .env file to place here
│   └── data/
│
└── shared/                # Code partagé
    ├── config/            # logger, https
    ├── middlewares/       # auth, error
    ├── models/            # User, Note
    ├── repositories/      # user, note
    ├── services/          # auth, note, replication, audit, tokenBlacklist
    ├── utils/             # crypto, validation, errors
    ├── validators/        # auth, note, share, lock (express-validator)
    └── certs/             # cert.pem, key.pem
```

### **Frontend**
```
frontend/
├── .env                # smaller here for SERVER_A=https://localhost:3001 and SERVER_B=https://localhost:3002
├── index.html          # Login
├── register.html       # Inscription
├── notes.html          # Liste des notes
├── edit.html           # Éditeur de notes
├── share.html          # Partage de notes
├── css/
│   ├── style.css       # Styles principaux
│   ├── auth.css        # Login/register
│   ├── editor.css      # Éditeur
│   └── search-filter.css
└── js/
    ├── api.service.js  # Axios + interceptors
    ├── failover.service.js  # Bascule auto Server A/B
    ├── auth.js         # Authentification
    ├── notes.js        # Gestion des notes
    ├── share.js        # Partage
    ├── search-filter.js
    ├── notifications.js
    ├── utils.js        # Token, sanitize
    └── server.js       # Serveur HTTPS local
```
## Frontend/.env
```
SERVER_A=https://localhost:3001
SERVER_B=https://localhost:3002
```
### **Documentation**
```
docs/
├── README_SECURITY.md       # Vue d'ensemble sécurité
├── SETUP.md                 # Guide d'installation
├── abuse-frames/
│   └── abuse_frames_analysis_v1.md
├── architecture/
│   └── architecture_overview.md
└── security/
    ├── threat_model.md
    ├── security_requirements.md
    ├── traceability_matrix.md
    ├── security_testing_plan.md
    ├── security_testing_report.md
    ├── owasp_mapping.md
    ├── risk_matrix.md
    ├── security_checklist_asvs.md
    └── security_tools_and_watch.md
```
## 🚀 Quick Start

Voir [SETUP.md](docs/SETUP.md) pour les instructions détaillées.

```bash
# 1. Cloner le projet
git clone <repo-url>
cd Softsec_security_groupe18

# 2. Générer les certificats HTTPS
./scripts/generate-certs.sh

# 3. Configurer les variables d'environnement
# Server A
cd backend/serverA
cp ../../../.env.example .env

# Server B
cd backend/serverB
cp ../../../.env.example .env

# STORAGE_ENCRYPTION_KEY (AES-256 – Base64 obligatoire)
openssl rand -base64 32

# REPLICATION_SECRET (Base64)
openssl rand -base64 32

# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Installer les dépendances
cd backend/serverA
npm install

cd ../serverB
npm install

cd ../shared
npm install

cd ../../frontend
npm install

# 5. Démarrer les serveurs
# Terminal 1: Server A
cd backend/serverA && npm start

# Terminal 2: Server B
cd backend/serverB && npm start

# Terminal 3: Frontend
cd frontend && npm start
```
### Exemple de .env à mettre dans [Server A](backend/serverA) et [Server B](backend/serverB) 
```bash
JWT_SECRET=...
STORAGE_ENCRYPTION_KEY=...
REPLICATION_SECRET=...

PORT_A=3001
PORT_B=3002

FRONTEND_ORIGIN=https://localhost:3000
PEER_SERVER_URL=https://localhost:3002

LOG_LEVEL=info
NODE_ENV=development
REPLICATION_TIMEOUT=5000
TOKEN_BLACKLIST_CLEANUP_INTERVAL=3600000
```

## 🧪 Tests
```bash
# Tests de sécurité (Server A)
cd backend/serverA
npm test

# Coverage
npm run test:coverage
```

## 📦 Technologies

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JS, Axios, DOMPurify
- **Sécurité:** bcrypt, jsonwebtoken, helmet, express-validator, express-rate-limit, cors, sanitize-html, cookie-parser
- **Chiffrement:** Node.js crypto (AES-256-GCM)
- **Tests:** Jest, Supertest

## 🔒 Sécurité & Compliance

Ce projet implémente les pratiques de sécurité:
- **OWASP Top 10 (2021)** - Toutes les catégories adressées
- **ASVS Level 2** - Application Security Verification Standard
- **Abuse Frames** - Threat modeling systématique
- **Security Testing** - 48 tests automatisés

Voir [Documentation Sécurité](docs/README_SECURITY.md) pour les détails.

## 📝 License

ISC - Projet académique

## 👥 Contributeurs

Groupe 18 - Université Côte d'Azur