# Rapport de tests – Server A Notes API

**Groupe 18 – DIOP**

## Préambule

Dans le cadre du projet backend (durée : 4 semaines), nous avons mis en place une API REST sécurisée permettant l’authentification des utilisateurs et la gestion de notes personnelles.
Afin de valider le bon fonctionnement de l’API, une **collection de tests automatisés Postman** a été conçue. Elle couvre à la fois les scénarios fonctionnels attendus et les cas d’erreur.

## 1. Contexte général des tests

* **Collection testée** : *Server A Notes API Tests Collection*
* **Environnement actif** : *Server A Environment*
* **URL de base** : `http://localhost:3001`

### Résumé du dernier run Postman

* **Nombre de requêtes** : 13
* **Nombre total de tests** : 48
* **Tests passés** : 48
* **Tests échoués** : 0
* **Statut global** : *passed*
* **Temps total d’exécution** : 2694 ms

➡️ L’ensemble des scénarios de test est validé.

## 2. Mise en place de l’environnement de test (Postman)

Avant l’exécution des tests, les étapes suivantes sont nécessaires :

1. Importer le fichier **`ServerA.environment.json`** dans la section *Environments*.
2. Importer le fichier **`ServerA.postman_collection.json`** dans la section *Collections*.
3. Sélectionner et **pinner l’environnement** *Server A Environment*.

Le pinning de l’environnement est essentiel : sans cela, Postman peut utiliser un environnement par défaut , entraînant des erreurs liées aux variables non définies (`BASE_URL`, `JWT_TOKEN`, etc.).


## 3. Scénarios testés

### 3.1 Authentification

* **Register User**
  Inscription avec email et mot de passe valide → **201 Created**

* **Register User – Already Exists**
  Tentative de réinscription / mot de passe faible → **400 Bad Request**

* **Login User**
  Connexion valide → **200 OK**, récupération et stockage du JWT

* **Login User – Wrong Password**
  Identifiants invalides → **401 Unauthorized**

➡️ Les flux d’authentification fonctionnent correctement, avec des codes HTTP et messages d’erreur cohérents.

### 3.2 Gestion des notes – cas positifs

* **Create Note** → **201 Created**
* **Get All Notes** → **200 OK**
* **Get Note by ID** → **200 OK**
* **Update Note** → **200 OK**
* **Delete Note** → **204 No Content**

➡️ Le cycle complet CRUD est fonctionnel pour un utilisateur authentifié.

### 3.3 Gestion des notes – cas négatifs

* **Get / Update / Delete Note avec ID invalide**
  ID UUID valide mais inexistant → **400 Bad Request**
  Message d’erreur : `"Note not found"`

Ces tests s’appuient sur la variable d’environnement `INVALID_NOTE_ID`, définie volontairement avec un UUID inexistant.

### 3.4 Accès non autorisé

* **Unauthorized Get Notes**
  Accès à `/notes` sans header `Authorization` → **401 Unauthorized**

➡️ La protection par JWT est correctement appliquée.

## 4. Analyse des problèmes rencontrés initialement

Des erreurs avaient été observées lors des premiers tests :

* **401 Unauthorized** inattendus sur certaines requêtes de notes
* Échecs sur les tests d’ID invalide

Ces problèmes ont été corrigés grâce à :

* une meilleure gestion du token JWT dans l’environnement Postman ;
* l’utilisation d’un UUID valide mais inexistant pour les tests négatifs.

Dans l’état actuel, les seuls codes 401 observés correspondent à des scénarios négatifs attendus.

---

## 5. Conclusion

* La collection **Server A Notes API Tests** est entièrement validée (**48/48 tests passés**).
* Les fonctionnalités d’authentification et de gestion des notes sont opérationnelles.
* Les cas d’erreur et d’accès non autorisé sont correctement gérés.
* La configuration Postman (environnement + collection) est stable et reproductible.