# Softsec Security Project  Groupe 18

Projet académique de développement logiciel sécurisé.
Architecture distribuée : deux serveurs Node.js (A et B), un frontend web et un système de réplication chiffrée.

## Installation des services backend

Chaque dossier backend correspond à un service Node.js indépendant.

### Installation

```bash
cd backend/serverA
npm install

cd ../serverB
npm install

cd ../shared
npm install


## HTTPS et certificats TLS

Le backend utilise HTTPS avec des certificats TLS auto-signés générés localement à l’aide d’OpenSSL.

Les certificats sont stockés dans le dossier `cert/`, qui est volontairement exclu du dépôt Git (`.gitignore`) pour des raisons de sécurité.

Chaque développeur doit générer ses propres certificats localement avant de lancer les serveurs.
