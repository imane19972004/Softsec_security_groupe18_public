import { logger } from '../config/index.js';

function createAuditService(dataDir) {
  return {
    logNoteModification: (userId, noteId, action, details) => {
      logger.info(`[AUDIT] User ${userId} ${action} note ${noteId} - ${JSON.stringify(details)}`);
    },
    logShareAction: (userId, noteId, recipientEmail, permission, action) => {
      logger.info(`[AUDIT] Share ${action} - User ${userId} -> ${recipientEmail} (${permission}) on note ${noteId}`);
    },
    logLockAction: (userId, noteId, action, details = {}) => {
      logger.info(`[AUDIT] User ${userId} ${action} note ${noteId} - ${JSON.stringify(details)}`);
    },
    getAuditStats: () => {
      // Ici tu peux retourner des stats simulées ou lire un fichier
      return { totalLogs: 0, noteModifications: 0, shares: 0, locks: 0 };
    }
  };
}

export { createAuditService };
