// backend/serverA/src/config/swagger.config.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure Notes API - Server A',
      version: '1.0.0',
      description: `
        API REST sécurisée pour la gestion de notes personnelles avec système de partage et réplication.
        
        ## Sécurité
        - Authentification JWT requise pour toutes les routes protégées
        - Chiffrement des données au repos (AES-256-GCM)
        - Rate limiting sur tous les endpoints
        - Protection CSRF, XSS, et injection
        - Headers de sécurité (Helmet.js)
        
        ## Architecture
        - Backend Node.js/Express
        - Stockage fichiers chiffrés
        - Réplication inter-serveurs sécurisée
        - Logs d'audit complets
      `,
      contact: {
        name: 'Groupe 18 - Softsec',
        email: 'security@example.com'
      },
      license: {
        name: 'ISC',
      }
    },
    servers: [
      {
        url: 'https://localhost:3001',
        description: 'Server A (Development)'
      },
      {
        url: 'https://localhost:3002',
        description: 'Server B (Replica)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via /auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique de l\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte'
            }
          },
          required: ['id', 'email']
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique de la note'
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID du propriétaire de la note'
            },
            title: {
              type: 'string',
              maxLength: 100,
              description: 'Titre de la note (max 100 caractères)'
            },
            content: {
              type: 'string',
              description: 'Contenu de la note (chiffré au repos)'
            },
            sharedWith: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  permission: {
                    type: 'string',
                    enum: ['read', 'write']
                  }
                }
              },
              description: 'Liste des utilisateurs avec qui la note est partagée'
            },
            locked: {
              type: 'boolean',
              description: 'Indique si la note est verrouillée'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'ownerId', 'title', 'content']
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur'
            }
          },
          required: ['error']
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre',
              example: 'SecureP@ss123'
            }
          },
          required: ['email', 'password']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecureP@ss123'
            }
          },
          required: ['email', 'password']
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token (expire dans 1h)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          },
          required: ['token']
        },
        CreateNoteRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: 100,
              example: 'Ma première note'
            },
            content: {
              type: 'string',
              example: 'Contenu de la note sécurisée'
            }
          },
          required: ['title', 'content']
        },
        UpdateNoteRequest: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              example: 'Contenu mis à jour'
            }
          },
          required: ['content']
        },
        ShareNoteRequest: {
          type: 'object',
          properties: {
            recipient: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur avec qui partager',
              example: 'colleague@example.com'
            },
            permission: {
              type: 'string',
              enum: ['read', 'write'],
              default: 'read',
              description: 'Niveau de permission accordé'
            }
          },
          required: ['recipient']
        },
        UnshareNoteRequest: {
          type: 'object',
          properties: {
            recipient: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur dont on révoque l\'accès',
              example: 'colleague@example.com'
            }
          },
          required: ['recipient']
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token JWT manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Accès interdit (permissions insuffisantes)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Forbidden'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Note not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Invalid email'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Trop de requêtes (rate limiting)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Too many requests'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints d\'authentification (inscription, connexion)'
      },
      {
        name: 'Notes',
        description: 'Gestion des notes (CRUD)'
      },
      {
        name: 'Sharing',
        description: 'Partage et révocation de notes'
      },
      {
        name: 'System',
        description: 'Endpoints système (santé, réplication)'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Chemins vers les fichiers contenant les annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;