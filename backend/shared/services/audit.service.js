// Service pour enregistrer les actions sensibles
export function logShareAction(userId, noteId, recipientEmail, permission, action) {
  logger.info(`[AUDIT] Share ${action} - User ${userId} -> ${recipientEmail} (${permission}) on note ${noteId}`);
}