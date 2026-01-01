import { logger } from "../config/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(
    `Error ${err.statusCode || 500} - ${req.method} ${req.originalUrl}`
  );

  res.status(err.statusCode || 500).json({
    error: "Internal Server Error"
  });
}
