# Softsec Security Project  Groupe 18

Projet académique de développement logiciel sécurisé.
Architecture distribuée : deux serveurs Node.js (A et B), un frontend web et un système de réplication chiffrée.

## Installation des services backend

Chaque dossier backend correspond à un service Node.js indépendant.

### [Installation](docs/SETUP.md)

```bash
cd backend/serverA
npm install

cd ../serverB
npm install

cd ../shared
npm install
```

## HTTPS et certificats TLS

Le backend utilise HTTPS avec des certificats TLS pour le développement local.

Les certificats doivent être créés localement et placés dans `/shared/certs/` (ce dossier est ignoré par Git via `.gitignore`).

Générez-les avec les scripts fournis.

## Ressources
1. [Script pour la génération des PEM](scripts/generate-certs.sh)
2. [Setup](docs/SETUP.md)