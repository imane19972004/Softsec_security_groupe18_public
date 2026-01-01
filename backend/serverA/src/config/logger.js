import winston from "winston";
import config from "../config.js";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

export const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }), // PAS de stack en prod
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});