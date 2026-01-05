import winston from "winston";

const NODE_ENV = process.env.NODE_ENV || "development";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

export const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

