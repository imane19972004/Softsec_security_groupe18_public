import { logger } from '../config/logger.js';

export default function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  
  // Ne pas logger les paramètres de la requête en production (peuvent contenir des données sensibles)
  const logMessage = process.env.NODE_ENV === 'production'
    ? `Error ${status}`
    : `Error ${status} - ${req.method} ${req.path} - ${err.message}`;
  
  logger.error(logMessage);

  res.status(status).json({
    error: err.message || 'Internal server error'
  });
}
